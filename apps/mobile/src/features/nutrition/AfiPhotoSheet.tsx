import { FOOD_GROUPS, measureMeta, type FoodGroup, type MealType } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { foodRepo, mealRepo } from '../../data/repositories'
import { track } from '@/lib/track'
import { Afi } from '@/ui/Afi'
import { photoTurn, type AfiPhotoReply } from './afiPhoto'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconCamera, IconMinus, IconPlus } from '@/ui/icons'

/**
 * Afi ile fotoğraftan besin ekleme — TAM EKRAN modal, sohbet düzeni ama
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
  const [addedExtras, setAddedExtras] = useState<string[]>([])
  const conversationId = useRef<string | null>(null)
  const tracked = useRef(false)

  // Her açılışta temiz sohbet + karşılama balonu
  useEffect(() => {
    if (!open) return
    conversationId.current = null
    tracked.current = false
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
    setAddedExtras([])
  }, [open, hint])

  const push = (m: Omit<ChatMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...m, id: nextId() }])

  const runTurn = async (input: { text?: string; imageBase64?: string }) => {
    setBusy(true)
    setReply(null)
    if (!tracked.current) {
      tracked.current = true
      track('afi_assist_used', { kind: 'photo' })
    }
    try {
      const out = await photoTurn({
        conversationId: conversationId.current,
        hint: hint?.trim() || undefined,
        ...input,
      })
      conversationId.current = out.conversationId
      push({ role: 'afi', text: out.reply.text })
      setReply(out.reply)
    } catch {
      push({ role: 'afi', text: 'Şu an bağlanamadım; birazdan tekrar dener misin?' })
    } finally {
      setBusy(false)
    }
  }

  const pickImage = async () => {
    if (busy) return
    // Kamera esas yol; izin yoksa ya da simülatör gibi kamerasız ortamda
    // galeriye düşülür (hata diyaloğu açılmaz).
    let result: ImagePicker.ImagePickerResult | null = null
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync()
      if (perm.granted) {
        result = await ImagePicker.launchCameraAsync({ quality: 0.4, base64: true })
      }
    } catch {
      result = null
    }
    if (!result || result.canceled) {
      try {
        const lib = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.4,
          base64: true,
        })
        if (lib.canceled) return
        result = lib
      } catch {
        return
      }
    }
    const asset = result.assets?.[0]
    if (!asset?.base64) return
    push({ role: 'user', imageUri: asset.uri })
    void runTurn({ imageBase64: asset.base64 })
  }

  const sendText = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    setDraft('')
    push({ role: 'user', text: trimmed })
    void runTurn({ text: trimmed })
  }

  const onChip = (label: string) => {
    if (label === 'Yakından çek' || label === 'Tekrar çek') {
      void pickImage()
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
  }

  const confirm = async () => {
    const food = reply?.food
    if (!food || saving) return
    setSaving(true)
    try {
      await logFood(food, qty)
      track('afi_suggestion_accepted', { kind: 'photo' })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setDone(true)
      push({
        role: 'afi',
        text: food.inPool
          ? 'Öğününe yazdım, afiyet olsun! 🧡'
          : 'Menüne ekledim ve öğününe yazdım, afiyet olsun! 🧡',
      })
      setReply(null)
      setTimeout(onClose, 1400)
    } finally {
      setSaving(false)
    }
  }

  // Ek besin: karede görülen diğer yiyecekler 1 ölçüyle tek dokunuş eklenir.
  const addExtra = async (food: NonNullable<AfiPhotoReply['food']>) => {
    if (addedExtras.includes(food.name)) return
    await logFood(food, 1)
    track('afi_suggestion_accepted', { kind: 'photo_extra' })
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setAddedExtras((prev) => [...prev, food.name])
  }

  // Yeni mesajda en alta kay
  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    return () => clearTimeout(id)
  }, [messages, busy, reply])

  const food = reply?.kind === 'result' ? reply.food : undefined

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-canvas"
        style={{ paddingTop: Platform.OS === 'android' ? insets.top : 0 }}
      >
        {/* Başlık — sabit */}
        <View className="flex-row items-center justify-between border-b border-line/60 bg-surface px-5 pb-3 pt-4">
          <View className="flex-row items-center gap-2">
            <Afi size={28} />
            <AppText weight="bold" className="text-lg text-ink">
              Afi ile ekle
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
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

          {/* Soru turu: çipli hızlı cevaplar */}
          {reply && reply.kind !== 'result' && reply.quickReplies.length > 0 && !busy ? (
            <View className="mt-1 flex-row flex-wrap gap-2 self-start">
              {reply.quickReplies.map((q) => (
                <Chip key={q} label={q} onPress={() => onChip(q)} />
              ))}
            </View>
          ) : null}

          {/* Sonuç kartı: düzenlenebilir taslak + miktar + onay */}
          {food && !done ? (
            <View className="mt-1 rounded-2xl border border-line bg-surface p-4">
              <AppText weight="bold" className="text-base text-ink">
                {food.name}
              </AppText>
              <View className="mt-2 flex-row flex-wrap items-center gap-1.5">
                {food.groups.map((g) => (
                  <Chip
                    key={g}
                    label={groupLabel(g)}
                    active
                    icon={<GroupIcon group={g} size={14} color="#ffffff" />}
                  />
                ))}
                <Chip label={`ölçü: ${measureMeta(food.measure).label}`} />
              </View>
              <AppText className="mt-2 text-xs text-soft">
                ~{Math.round(food.macros.kcal)} kcal · P {Math.round(food.macros.protein)}g · K{' '}
                {Math.round(food.macros.carb)}g · Y {Math.round(food.macros.fat)}g
              </AppText>
              {food.description ? (
                <AppText className="mt-1 text-xs text-faint">{food.description}</AppText>
              ) : null}

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
                  {numQty.format(qty)} {measureMeta(food.measure).label}
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
                  {food.inPool ? 'Öğüne yaz' : 'Menüne ekle ve öğüne yaz'}
                </AppText>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onClose} className="mt-2 items-center py-1.5">
                <AppText className="text-xs text-faint">Vazgeç</AppText>
              </Pressable>
            </View>
          ) : null}

          {/* Karede görülen ek besinler — her biri 1 ölçüyle tek dokunuş */}
          {reply?.kind === 'result' && reply.extraFoods.length > 0 && !done ? (
            <View className="mt-1 gap-2">
              {reply.extraFoods.map((f) => {
                const added = addedExtras.includes(f.name)
                return (
                  <View
                    key={f.name}
                    className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
                  >
                    <View className="min-w-0 flex-1">
                      <AppText weight="semibold" className="text-sm text-ink">
                        {f.name}
                      </AppText>
                      <AppText className="text-xs text-faint">
                        ~{Math.round(f.macros.kcal)} kcal · 1 {measureMeta(f.measure).label}
                      </AppText>
                    </View>
                    {added ? (
                      <AppText className="text-xs text-faint">Eklendi ✓</AppText>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${f.name} besinini de öğüne ekle`}
                        onPress={() => void addExtra(f)}
                        className="rounded-full bg-emerald-100 px-3 py-1.5 dark:bg-emerald-900/60"
                      >
                        <AppText weight="bold" className="text-xs text-emerald-800 dark:text-emerald-200">
                          Bunu da ekle
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                )
              })}
            </View>
          ) : null}
        </ScrollView>

        {/* Yazışma çubuğu — sabit alt bar */}
        {!done ? (
          <View
            className="flex-row items-center gap-2 border-t border-line/60 bg-surface px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf çek"
              onPress={() => void pickImage()}
              disabled={busy}
              className={`h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 ${busy ? 'opacity-40' : ''}`}
            >
              <IconCamera size={22} color="#ffffff" />
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
      </KeyboardAvoidingView>
    </Modal>
  )
}
