import {
  findSeedFood,
  FOOD_GROUPS,
  measureMeta,
  turkishLower,
  type CustomFood,
  type FoodGroup,
  type MealType,
} from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { foodRepo, mealRepo } from '../../data/repositories'
import {
  clearAfiPhotoDraft,
  loadAfiPhotoDraft,
  saveAfiPhotoDraft,
  type AfiPhotoDraftScope,
} from './afiPhotoDraft'
import { isHandledFood, removeConfirmedFood } from './afiPhotoQueue'
import { photoPermissionCopy, type PhotoSource } from './afiPhotoPermission'
import { useCustomFoods } from './useCustomFoods'
import { track } from '@/lib/track'
import { Afi } from '@/ui/Afi'
import {
  photoTurn,
  pickFromCamera,
  pickFromLibrary,
  type AfiPhotoFood,
  type AfiPhotoReply,
  type PhotoPickResult,
} from './afiPhoto'
import { RequestTurnGuard } from './requestTurnGuard'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconCamera, IconImage, IconMinus, IconPlus } from '@/ui/icons'

/**
 * Afi ile fotoğraftan besin ekleme, TAM EKRAN modal, sohbet düzeni ama
 * süreç odaklı: Afi ya net soru sorar (çipli cevaplar, gerekirse ek
 * fotoğraf) ya da düzenlenebilir sonuç kartı düşürür. Havuzda olmayan
 * besin tek dokunuşla Menüm'e kaydedilip öğüne yazılır (afi-asistan.md).
 */

interface AfiPhotoSheetProps {
  open: boolean
  profileId: number
  date: string
  meal: MealType
  /** Besin Ekle'de yazılmış ad; ilk turda Afi'ye referans olarak gider. */
  hint?: string
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: 'afi' | 'user'
  text?: string
  imageUri?: string
}

const QTY_STEP = 0.5
const QTY_MIN = 0.5
const QTY_MAX = 12
const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

let msgSeq = 0
const nextId = () => `m${String(++msgSeq)}`

const groupLabel = (g: FoodGroup) => FOOD_GROUPS.find((x) => x.key === g)?.label ?? g

// Ad karşılaştırması: aynı besin iki kez eklenmesin / listede tekrar etmesin.
const norm = (s: string) => turkishLower(s.trim())

/**
 * Havuz eşleşmesi: Afi'nin tahmini yerine BİZİM değerlerimiz kazanır. Ad
 * katalogda (SEED_FOODS) ya da kullanıcının menüsünde (customFoods) varsa
 * o kaydın grup/ölçü/makrosuyla değiştiririz ve inPool işaretleriz; böylece
 * aynı besin ikinci kez menüye yazılmaz, kart da listedeki kaloriyi gösterir.
 * Eşleşme yoksa besin Afi'nin taslağıyla kalır (inPool sunucudan gelen değer).
 */
function resolveFromPool(food: AfiPhotoFood, customFoods: CustomFood[]): AfiPhotoFood {
  const key = norm(food.name)

  // Menü katalogdan önce gelir: kullanıcı kendi değerlerini düzeltmiş olabilir.
  const custom = customFoods.find((c) => norm(c.name) === key)
  if (custom) {
    return {
      ...food,
      name: custom.name,
      groups: custom.groups,
      measure: custom.measure ?? food.measure,
      macros: custom.macros ?? food.macros,
      description: custom.description ?? food.description,
      inPool: true,
    }
  }

  const seed = findSeedFood(food.name)
  if (seed) {
    return {
      ...food,
      name: seed.name,
      groups: seed.groups,
      measure: seed.measure,
      macros: seed.macros,
      description: seed.description,
      inPool: true,
    }
  }

  return food
}

// Builds a resolved, deduplicated queue and excludes foods already handled in this session.
function buildQueue(
  reply: AfiPhotoReply,
  logged: Set<string>,
  rejected: Set<string>,
  customFoods: CustomFood[],
): AfiPhotoFood[] {
  const seen = new Set<string>()
  const out: AfiPhotoFood[] = []
  for (const raw of [reply.food, ...reply.extraFoods]) {
    if (!raw) continue
    const f = resolveFromPool(raw, customFoods)
    const key = norm(f.name)
    if (isHandledFood(f.name, logged, rejected) || seen.has(key)) continue
    seen.add(key)
    out.push(f)
  }
  return out
}

export function AfiPhotoSheet({ open, profileId, date, meal, hint, onClose }: AfiPhotoSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState<AfiPhotoReply | null>(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [qty, setQty] = useState(1)
  const [draft, setDraft] = useState('')
  const [permissionIssue, setPermissionIssue] = useState<{
    source: PhotoSource
    canAskAgain: boolean
  } | null>(null)
  // The queue head is editable; later findings remain compact until promoted.
  // Accepted and rejected names stay excluded for the lifetime of this sheet session.
  const [queue, setQueue] = useState<AfiPhotoFood[]>([])
  const draftReady = useRef(false)
  const loggedNames = useRef<Set<string>>(new Set())
  const rejectedNames = useRef<Set<string>>(new Set())
  // Kullanıcının menüsü: kuyruk kurulurken havuz eşleşmesi için okunur.
  // runTurn bir async kapanış olduğundan ref'ten okuruz (bayat dizi olmasın).
  const customFoods = useCustomFoods()
  const customFoodsRef = useRef(customFoods)
  useEffect(() => {
    customFoodsRef.current = customFoods
  }, [customFoods])
  // Klavye yüksekliği (iOS): bu ekran presentationStyle="pageSheet" bir Modal;
  // KeyboardAvoidingView'ın behavior="padding" hesabı pageSheet kartında
  // kartın üst boşluğu kadar eksik kalıp giriş çubuğunu klavyenin altında
  // bırakıyordu. Klavye yüksekliğini elle ölçüp alt bara birebir yansıtıyoruz.
  // Android'de pencere kendisi resize olduğundan (adjustResize) buna gerek yok.
  const [kbHeight, setKbHeight] = useState(0)
  const conversationId = useRef<string | null>(null)
  const tracked = useRef(false)
  const turnGuard = useRef(new RequestTurnGuard())

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    const show = Keyboard.addListener('keyboardWillShow', (e) => setKbHeight(e.endCoordinates.height))
    const hide = Keyboard.addListener('keyboardWillHide', () => setKbHeight(0))
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  // Each opening restores a matching short-lived draft before persistence resumes.
  useEffect(() => {
    const guard = turnGuard.current
    if (!open) {
      guard.closeSession()
      draftReady.current = false
      return
    }
    let cancelled = false
    guard.openSession()
    conversationId.current = null
    tracked.current = false
    draftReady.current = false
    setMessages([
      {
        id: nextId(),
        role: 'afi',
        text: hint?.trim()
          ? `Merhaba! "${hint.trim()}" için fotoğraf çek, birlikte netleştirelim 🍲`
          : 'Merhaba! Besinin fotoğrafını çek, tanımaya çalışayım 🍲',
      },
    ])
    setReply(null)
    setBusy(false)
    setSaving(false)
    setDone(false)
    setQty(1)
    setDraft('')
    setPermissionIssue(null)
    setQueue([])
    loggedNames.current = new Set()
    rejectedNames.current = new Set()
    setKbHeight(0)
    const scope: AfiPhotoDraftScope = { profileId, date, meal }
    void loadAfiPhotoDraft(scope).then((stored) => {
      if (cancelled || !guard.isSessionOpen()) return
      if (stored) {
        setMessages(stored.messages.map((message) => ({ ...message, id: nextId() })))
        setQueue(stored.queue)
        setQty(Math.min(QTY_MAX, Math.max(QTY_MIN, stored.quantity)))
        conversationId.current = stored.conversationId
        loggedNames.current = new Set(stored.loggedNames)
        rejectedNames.current = new Set(stored.rejectedNames)
      }
      draftReady.current = true
    })
    return () => {
      cancelled = true
      guard.closeSession()
    }
  }, [open, hint, profileId, date, meal])

  useEffect(() => {
    if (!open || !draftReady.current) return
    const scope: AfiPhotoDraftScope = { profileId, date, meal }
    if (queue.length === 0) {
      void clearAfiPhotoDraft().catch(() => undefined)
      return
    }
    void saveAfiPhotoDraft(scope, {
      messages: messages.map(({ role, text, imageUri }) => ({ role, text, imageUri })),
      queue,
      conversationId: conversationId.current,
      quantity: qty,
      loggedNames: [...loggedNames.current],
      rejectedNames: [...rejectedNames.current],
    }).catch(() => undefined)
  }, [date, meal, messages, open, profileId, qty, queue])

  const push = (m: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...m, id: nextId() }])

  const runTurn = async (input: { text?: string; imageBase64?: string }) => {
    const turn = turnGuard.current.start()
    if (!turn) return
    setBusy(true)
    setReply(null)
    if (!tracked.current) {
      tracked.current = true
      track('afi_assist_used', { kind: 'photo' })
    }
    try {
      const out = await photoTurn(
        {
          conversationId: conversationId.current,
          hint: hint?.trim() || undefined,
          ...input,
        },
        turn.signal,
      )
      if (!turnGuard.current.isCurrent(turn.id)) return
      conversationId.current = out.conversationId
      push({ role: 'afi', text: out.reply.text })
      setReply(out.reply)
      // Yeni sonuç geldiyse kuyruğu tazele (foto ya da chatten düzeltme):
      // ana + ekler yeniden sıralanır, önceki ana bulgu artık kuyruğun başı.
      if (out.reply.kind === 'result') {
        setQueue(
          buildQueue(
            out.reply,
            loggedNames.current,
            rejectedNames.current,
            customFoodsRef.current,
          ),
        )
        setQty(1)
      }
    } catch {
      if (!turnGuard.current.isCurrent(turn.id)) return
      push({ role: 'afi', text: 'Şu an bağlanamadım; birazdan tekrar dener misin?' })
    } finally {
      if (turnGuard.current.finish(turn.id)) setBusy(false)
    }
  }

  // Routes picker outcomes without treating a user cancellation as an error.
  const handlePicked = (result: PhotoPickResult) => {
    if (!turnGuard.current.isSessionOpen()) return
    if (result.kind === 'cancelled') {
      setPermissionIssue(null)
      return
    }
    if (result.kind === 'permission-denied') {
      setPermissionIssue({ source: result.source, canAskAgain: result.canAskAgain })
      return
    }
    if (result.kind === 'error') {
      setPermissionIssue(null)
      push({
        role: 'afi',
        text: 'Fotoğrafı şu an açamadım. Birazdan tekrar deneyebilir veya besinin adını yazabilirsin.',
      })
      return
    }
    setPermissionIssue(null)
    push({ role: 'user', imageUri: result.image.uri })
    void runTurn({ imageBase64: result.image.base64 })
  }

  const takePhoto = async () => {
    if (busy) return
    handlePicked(await pickFromCamera())
  }

  const chooseFromLibrary = async () => {
    if (busy) return
    handlePicked(await pickFromLibrary())
  }

  const resolvePermissionIssue = () => {
    if (!permissionIssue) return
    if (!permissionIssue.canAskAgain) {
      void Linking.openSettings().catch(() => {
        push({ role: 'afi', text: 'Ayarları şu an açamadım. Dilersen cihaz ayarlarından afiet’i bulabilirsin.' })
      })
      return
    }
    setPermissionIssue(null)
    if (permissionIssue.source === 'camera') void takePhoto()
    else void chooseFromLibrary()
  }

  const sendText = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy || !turnGuard.current.isSessionOpen()) return
    setDraft('')
    push({ role: 'user', text: trimmed })
    void runTurn({ text: trimmed })
  }

  const onChip = (label: string) => {
    if (label === 'Yakından çek' || label === 'Tekrar çek') {
      void takePhoto()
      return
    }
    sendText(label)
  }

  // Bir besini kaydeder: menüde yoksa Menüm'e ekler, sonra öğüne yazar.
  const logFood = async (food: NonNullable<AfiPhotoReply['food']>, quantity: number) => {
    if (!food.inPool) {
      await foodRepo.saveCustom({
        name: food.name,
        groups: food.groups,
        measure: food.measure,
        macros: food.macros,
        description: food.description,
      })
    }
    await mealRepo.add({
      profileId,
      date,
      meal,
      foodName: food.name,
      quantity,
      measure: food.measure,
      groups: food.groups,
      createdAt: new Date().toISOString(),
    })
    track('meal_logged', {
      meal,
      group_count: food.groups.length,
      source: food.inPool ? 'seed' : 'custom',
    })
  }

  // Kuyruğun başındaki (ana) besini öğüne yazar. Sheet'i kapatmayız: eklendi
  // onayı düşer ve sıradaki besin kendiliğinden ana bulguya (kuyruğun başına)
  // geçer; kuyruk boşalınca "başka besin var mı?" devam sorusu gelir.
  const confirm = async () => {
    const head = queue[0]
    if (!head || saving) return
    setSaving(true)
    try {
      await logFood(head, qty)
      track('afi_suggestion_accepted', { kind: 'photo' })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      loggedNames.current.add(norm(head.name))
      const rest = queue.slice(1)
      setQueue((current) => removeConfirmedFood(current, head.name))
      setQty(1)
      const wrote = head.inPool ? 'Öğüne yazdım' : 'Menüne ekleyip öğüne yazdım'
      push({
        role: 'afi',
        text:
          rest.length > 0
            ? `${wrote}, afiyet olsun! 🧡 Sırada "${rest[0].name}" var. Doğruysa ekle, değilse reddet ya da doğrusunu bana yaz.`
            : `${wrote}, afiyet olsun! 🧡 Sofranda başka bir besin var mı? Fotoğrafını çek ya da adını yaz.`,
      })
    } catch {
      // Kaydetme hatası sessiz kalmamalı: buton basılıyor ama hiçbir şey
      // olmuyor görüntüsü tam olarak buradan çıkıyordu.
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      push({
        role: 'afi',
        text: `"${head.name}" kaydedilemedi, bağlantı takılmış olabilir. Bir daha dener misin?`,
      })
    } finally {
      setSaving(false)
    }
  }

  // Ana besini eklemeden reddet: yanlış tanınmış olabilir. Kuyruktan düşer,
  // sıradaki ana bulguya geçer. Kullanıcı doğrusunu chatten yazarak düzeltebilir.
  const rejectHead = () => {
    const head = queue[0]
    if (!head) return
    void Haptics.selectionAsync()
    track('afi_suggestion_rejected', { kind: 'photo' })
    rejectedNames.current.add(norm(head.name))
    const rest = queue.slice(1)
    setQueue(rest)
    setQty(1)
    push({
      role: 'afi',
      text:
        rest.length > 0
          ? `Tamam, "${head.name}" değilmiş, çıkardım. Sırada "${rest[0].name}" var. Doğrusunu yazarsan hemen düzeltirim.`
          : `Tamam, "${head.name}" değilmiş, çıkardım. Doğru besinin adını yaz ya da yeni bir fotoğraf çek, birlikte bulalım.`,
    })
  }

  // Yeni mesajda en alta kay
  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    return () => clearTimeout(id)
  }, [messages, busy, reply])

  const head = queue[0]
  const rest = queue.slice(1)
  const permissionCopy = permissionIssue
    ? photoPermissionCopy(permissionIssue.source, permissionIssue.canAskAgain)
    : null

  const closeSheet = () => {
    turnGuard.current.closeSession()
    setBusy(false)
    onClose()
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeSheet}
    >
      <View
        className="flex-1 bg-canvas"
        style={{ paddingTop: Platform.OS === 'android' ? insets.top : 0 }}
      >
        {/* Başlık, sabit */}
        <View className="flex-row items-center justify-between border-b border-line/60 bg-surface px-5 pb-3 pt-4">
          <View className="flex-row items-center gap-2">
            <Afi size={28} />
            <AppText weight="bold" className="text-lg text-ink">
              Afi ile ekle
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={closeSheet}
            className="rounded-full bg-muted px-3 py-1"
          >
            <AppText className="text-sm text-soft">Kapat</AppText>
          </Pressable>
        </View>

        {/* Sohbet akışı */}
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 8 }}
          className="flex-1"
        >
          {messages.map((m) =>
            m.role === 'afi' ? (
              <View key={m.id} className="max-w-[85%] self-start rounded-2xl rounded-tl-md bg-surface px-4 py-3">
                <AppText className="text-sm leading-relaxed text-ink">{m.text}</AppText>
              </View>
            ) : m.imageUri ? (
              <Image
                key={m.id}
                source={{ uri: m.imageUri }}
                className="h-32 w-44 self-end rounded-2xl rounded-tr-md"
                resizeMode="cover"
                accessibilityLabel="Gönderdiğin fotoğraf"
              />
            ) : (
              <View key={m.id} className="max-w-[85%] self-end rounded-2xl rounded-tr-md bg-emerald-600 px-4 py-3">
                <AppText className="text-sm text-white">{m.text}</AppText>
              </View>
            ),
          )}

          {busy ? (
            <View className="flex-row items-center gap-2 self-start rounded-2xl rounded-tl-md bg-surface px-4 py-3">
              <ActivityIndicator size="small" color={isDark ? '#34d399' : '#059669'} />
              <AppText className="text-sm text-soft">Afi bakıyor…</AppText>
            </View>
          ) : null}

          {permissionIssue && permissionCopy ? (
            <View className="max-w-[85%] self-start rounded-2xl rounded-tl-md bg-surface px-4 py-3">
              <AppText className="text-sm leading-relaxed text-ink">
                {permissionCopy.message}
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={resolvePermissionIssue}
                className="mt-3 self-start rounded-xl bg-emerald-600 px-4 py-2.5"
              >
                <AppText weight="semibold" className="text-sm text-white">
                  {permissionCopy.actionLabel}
                </AppText>
              </Pressable>
            </View>
          ) : null}

          {/* Soru turu: çipli hızlı cevaplar */}
          {reply && reply.kind !== 'result' && reply.quickReplies.length > 0 && !busy ? (
            <View className="mt-1 flex-row flex-wrap gap-2 self-start">
              {reply.quickReplies.map((q) => (
                <Chip key={q} label={q} onPress={() => onChip(q)} />
              ))}
            </View>
          ) : null}

          {/* Ana bulgu kartı: kuyruğun başı, düzenlenebilir taslak + miktar +
              onay. "Bunu reddet" ile eklemeden atlanır, sıradaki başa geçer. */}
          {head && !done ? (
            <View className="mt-1 rounded-2xl border border-line bg-surface p-4">
              <AppText weight="bold" className="text-base text-ink">
                {head.name}
              </AppText>
              <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                {head.groups.map((g) => (
                  <Chip
                    key={g}
                    label={groupLabel(g)}
                    active
                    icon={<GroupIcon group={g} size={14} color="#ffffff" />}
                  />
                ))}
                <Chip label={`ölçü: ${measureMeta(head.measure).label}`} />
              </View>
              <AppText className="mt-2 text-xs text-soft">
                ~{Math.round(head.macros.kcal)} kcal · P {Math.round(head.macros.protein)}g · K{' '}
                {Math.round(head.macros.carb)}g · Y {Math.round(head.macros.fat)}g
              </AppText>
              {head.description ? (
                <AppText className="mt-1 text-xs text-faint">{head.description}</AppText>
              ) : null}
              <AppText className="mt-1 text-xs text-faint">
                {head.inPool
                  ? 'Bu besin listende zaten var, değerleri oradan aldım. Yalnızca öğününe yazacağım.'
                  : 'Yanlışsa doğrusunu bana yaz, hemen düzeltirim.'}
              </AppText>

              <View className="mt-3 flex-row items-center gap-3">
                <AppText className="text-sm text-soft">Miktar</AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Miktarı azalt"
                  onPress={() => setQty((q) => Math.max(QTY_MIN, q - QTY_STEP))}
                  className="h-8 w-8 items-center justify-center rounded-full bg-muted"
                >
                  <IconMinus size={16} color={t.soft} />
                </Pressable>
                <AppText weight="bold" className="text-ink">
                  {numQty.format(qty)} {measureMeta(head.measure).label}
                </AppText>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Miktarı artır"
                  onPress={() => setQty((q) => Math.min(QTY_MAX, q + QTY_STEP))}
                  className="h-8 w-8 items-center justify-center rounded-full bg-muted"
                >
                  <IconPlus size={16} color={t.soft} />
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => void confirm()}
                disabled={saving}
                className={`mt-3 items-center rounded-xl bg-emerald-600 py-3 ${saving ? 'opacity-40' : ''}`}
              >
                <AppText weight="semibold" className="text-white">
                  {head.inPool ? 'Öğüne yaz' : 'Menüne ekle ve öğüne yaz'}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${head.name} bulgusunu reddet`}
                onPress={rejectHead}
                disabled={saving}
                className="mt-2 items-center py-1.5"
              >
                <AppText className="text-xs text-soft">Bunu reddet</AppText>
              </Pressable>
            </View>
          ) : null}

          {/* Kuyruğun kalanı: SEÇENEKSİZ önizleme. Tek seferde tek karar
              verilir; sıradaki besin, baştaki eklenince ya da reddedilince
              kendiliğinden yukarıdaki ana karta geçer. */}
          {rest.length > 0 && !done ? (
            <View className="mt-1 gap-2">
              <AppText className="px-1 text-xs text-faint">Tespit ettiğim diğer besinler:</AppText>
              {rest.map((f) => (
                <View
                  key={f.name}
                  className="flex-row items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3"
                >
                  <View className="min-w-0 flex-1">
                    <AppText weight="semibold" className="text-sm text-ink">
                      {f.name}
                    </AppText>
                    <AppText className="text-xs text-faint">
                      ~{Math.round(f.macros.kcal)} kcal · 1 {measureMeta(f.measure).label}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Yazışma çubuğu, sabit alt bar; klavye açıkken tam yükseklik kadar
            yukarı çıkar (pageSheet Modal'da elle ölçülen klavye payı) */}
        {!done ? (
          <View
            className="flex-row items-center gap-2 border-t border-line/60 bg-surface px-4 pt-3"
            style={{ paddingBottom: kbHeight > 0 ? kbHeight + 10 : Math.max(insets.bottom, 12) }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf çek"
              onPress={() => void takePhoto()}
              disabled={busy}
              className={`h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 ${busy ? 'opacity-40' : ''}`}
            >
              <IconCamera size={22} color="#ffffff" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Galeriden seç"
              onPress={() => void chooseFromLibrary()}
              disabled={busy}
              className={`h-11 w-11 items-center justify-center rounded-xl bg-muted ${busy ? 'opacity-40' : ''}`}
            >
              <IconImage size={22} color={t.soft} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="ya da yaz…"
              placeholderTextColor={t.faint}
              editable={!busy}
              onSubmitEditing={() => sendText(draft)}
              returnKeyType="send"
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: t.line,
                borderRadius: 22,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontFamily: 'Nunito_400Regular',
                fontSize: 15,
                color: t.ink,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gönder"
              onPress={() => sendText(draft)}
              disabled={busy || !draft.trim()}
              className={`rounded-full bg-muted px-3.5 py-2.5 ${busy || !draft.trim() ? 'opacity-40' : ''}`}
            >
              <AppText weight="bold" className="text-sm text-soft">
                Gönder
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  )
}
