import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  measureMeta,
  type CustomFood,
  type FoodGroup,
  type FoodMeasure,
  type Macros,
} from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  type TextStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { foodRepo } from '../../data/repositories'
import { track } from '@/lib/track'
import { Afi } from '@/ui/Afi'
import { suggestFood } from './afi'
import { photoTurn, pickFromCamera, pickFromLibrary, type PickedImage } from './afiPhoto'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconBookmarkPlus, IconCamera, IconImage, IconTrash } from '@/ui/icons'

/**
 * Menü besini ekranı — listede olmayan bir besini grup, ölçü, makro ve
 * kısa bilgiyle kaydeder; Menüm ekranından düzenleme/silme de buradan.
 * Bottom-sheet değil TAM EKRAN modal (iOS'ta native pageSheet kartı):
 * başlık ve kaydet çubuğu sabit, form ortada kayar; üst güvenli alana
 * taşma yapısal olarak mümkün değil.
 */

interface CustomFoodSheetProps {
  open: boolean
  /** Önceden dolu alanlar; id varsa düzenleme modu (Sil görünür) */
  initial: CustomFood | null
  onClose: () => void
  onSaved?: (food: CustomFood) => void
}

const MACRO_FIELDS: { key: keyof Macros; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Enerji', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carb', label: 'Karbonhidrat', unit: 'g' },
  { key: 'fat', label: 'Yağ', unit: 'g' },
]

/** "1,5" da "1.5" da kabul — geçersizse null */
function parseNum(value: string): number | null {
  const n = parseFloat(value.trim().replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : null
}

const numToStr = (n: number | undefined) =>
  n === undefined ? '' : String(n).replace('.', ',')

export function CustomFoodSheet({ open, initial, onClose, onSaved }: CustomFoodSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const insets = useSafeAreaInsets()
  const [name, setName] = useState('')
  const [groups, setGroups] = useState<FoodGroup[]>([])
  const [measure, setMeasure] = useState<FoodMeasure>('porsiyon')
  const [macroText, setMacroText] = useState<Record<keyof Macros, string>>({
    kcal: '',
    protein: '',
    carb: '',
    fat: '',
  })
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const savingRef = useRef(false)
  // Afi doldurma: bekleme + "öneri geldi" durumu (kaydetmede afi_suggestion_accepted)
  const [afiBusy, setAfiBusy] = useState(false)
  // Fotoğraftan tanıma sonrası sakin bir bilgi notu (net sonuç çıkmazsa
  // kullanıcı boşlukta kalmasın); yargısız dil.
  const [photoNote, setPhotoNote] = useState<string | null>(null)
  const afiFilled = useRef(false)
  // Son Afi açıklaması: kullanıcı elle değiştirmediyse yeni öneri üzerine yazar
  // ("başka ad yazıp tekrar Doldur" akışında not bayat kalmasın)
  const lastAfiDescription = useRef<string | null>(null)
  // Kademeli açılım: ayrıntılar (grup/ölçü/makro/not) varsayılan kapalı —
  // Afi doldurunca ya da kullanıcı isteyince açılır; düzenleme modunda hep açık
  const [detailsOpen, setDetailsOpen] = useState(false)
  // Grup çipleri: kapalıyken yalnız seçililer (seçim yoksa ilk 3 varsayılan)
  // görünür; "+N daha" ile tam liste açılır
  const [groupsExpanded, setGroupsExpanded] = useState(false)

  // Her açılışta formu initial'dan BİR KEZ tohumla — initial'ın render'lar
  // arası kimlik değişimi açık formdaki girdiyi ezmesin
  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current) return
    seeded.current = true
    afiFilled.current = false
    lastAfiDescription.current = null
    setAfiBusy(false)
    setSaveError(null)
    setPhotoNote(null)
    setGroupsExpanded(false)
    setDetailsOpen(initial?.id !== undefined)
    setName(initial?.name ?? '')
    setGroups(initial?.groups ?? [])
    setMeasure(initial?.measure ?? 'porsiyon')
    setMacroText({
      kcal: numToStr(initial?.macros?.kcal),
      protein: numToStr(initial?.macros?.protein),
      carb: numToStr(initial?.macros?.carb),
      fat: numToStr(initial?.macros?.fat),
    })
    setDescription(initial?.description ?? '')
    // Yeni besin adıyla geldiyse (Besin Ekle akışı) Afi'den otomatik geçer:
    // öneri gelir, ayrıntılar açılır, kullanıcı gözden geçirip kaydeder.
    const seedName = initial?.name?.trim()
    if (initial?.id === undefined && seedName) void runAfi(seedName)
  }, [open, initial])

  const editing = initial?.id !== undefined
  const hasName = name.trim().length > 0
  // Saving requires a name, at least one group, and all four approximate values.
  const groupsOk = groups.length > 0
  const macrosOk = MACRO_FIELDS.every((f) => parseNum(macroText[f.key]) !== null)
  const canSave = hasName && groupsOk && macrosOk

  // Grup çipleri: kapalı görünümde yalnız seçililer; hiç seçim yoksa ilk 3
  // varsayılan gösterilir, kalanı "+N daha" ile açılır.
  const visibleGroups = groupsExpanded
    ? FOOD_GROUPS
    : groups.length > 0
      ? FOOD_GROUPS.filter((g) => groups.includes(g.key))
      : FOOD_GROUPS.slice(0, 3)
  const hiddenGroupCount = groupsExpanded ? 0 : FOOD_GROUPS.length - visibleGroups.length

  const toggleGroup = (g: FoodGroup) => {
    void Haptics.selectionAsync()
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  // Afi doldurma: ad üzerinden öneri ister, formu doldurur; her alan
  // düzenlenebilir kalır, kullanıcı onaylamadan kayda geçmez (afi-asistan.md).
  const runAfi = async (trimmed: string) => {
    if (!trimmed) return
    setAfiBusy(true)
    track('afi_assist_used', { kind: 'menu' })
    try {
      const s = await suggestFood(trimmed)
      setGroups(s.groups)
      setMeasure(s.measure)
      setMacroText({
        kcal: numToStr(s.macros.kcal),
        protein: numToStr(s.macros.protein),
        carb: numToStr(s.macros.carb),
        fat: numToStr(s.macros.fat),
      })
      // Açıklama: boşsa ya da hâlâ önceki Afi notuysa üzerine yaz; kullanıcı
      // elle yazdıysa dokunma (sahiplik kullanıcıda).
      if (s.description) {
        setDescription((cur) => {
          const t = cur.trim()
          return !t || t === lastAfiDescription.current ? s.description! : cur
        })
        lastAfiDescription.current = s.description
      }
      afiFilled.current = true
      setDetailsOpen(true)
      setGroupsExpanded(false)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      // çevrimdışı / hata: sessiz kal, form elle doldurulabilir durumda
    } finally {
      setAfiBusy(false)
    }
  }

  const askAfi = () => {
    if (afiBusy) return
    void runAfi(name.trim())
  }

  // Fotoğraftan tanıma: Afi'nin foto akışını tek turluk kullanır; net bir
  // besin çıkarsa formu DÜZENLENEBİLİR biçimde doldurur (kullanıcı onaylamadan
  // kayda geçmez). Ad boşsa tanınan adla dolar, kullanıcı yazdıysa ona dokunmaz.
  const runAfiPhoto = async (img: PickedImage) => {
    if (afiBusy) return
    setAfiBusy(true)
    setPhotoNote(null)
    track('afi_assist_used', { kind: 'menu_photo' })
    try {
      const out = await photoTurn({
        conversationId: null,
        imageBase64: img.base64,
        hint: name.trim() || undefined,
      })
      const food = out.reply.food
      if (food) {
        setName((cur) => (cur.trim() ? cur : food.name))
        setGroups(food.groups)
        setMeasure(food.measure)
        setMacroText({
          kcal: numToStr(food.macros.kcal),
          protein: numToStr(food.macros.protein),
          carb: numToStr(food.macros.carb),
          fat: numToStr(food.macros.fat),
        })
        if (food.description) {
          setDescription((cur) => {
            const c = cur.trim()
            return !c || c === lastAfiDescription.current ? food.description! : cur
          })
          lastAfiDescription.current = food.description
        }
        afiFilled.current = true
        setDetailsOpen(true)
        setGroupsExpanded(false)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } else {
        // Net sonuç yok: sakinçe yönlendir, form elle doldurulabilir kalır.
        setPhotoNote(out.reply.text || 'Bu kareden net çıkaramadım; adını yazıp Doldur diyebilirsin.')
      }
    } catch {
      setPhotoNote('Şu an bağlanamadım; adını yazıp Doldur diyebilir ya da elle girebilirsin.')
    } finally {
      setAfiBusy(false)
    }
  }

  const takePhoto = async () => {
    if (afiBusy) return
    const img = await pickFromCamera()
    if (img) void runAfiPhoto(img)
  }

  const chooseFromLibrary = async () => {
    if (afiBusy) return
    const img = await pickFromLibrary()
    if (img) void runAfiPhoto(img)
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || !canSave || savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      // If any macro is entered, missing values are treated as zero.
      const entered = MACRO_FIELDS.map((f) => [f.key, parseNum(macroText[f.key])] as const)
      const anyMacro = entered.some(([, v]) => v !== null)
      const macros = anyMacro
        ? (Object.fromEntries(entered.map(([k, v]) => [k, v ?? 0])) as unknown as Macros)
        : undefined
      const food: CustomFood = {
        id: initial?.id,
        name: trimmed,
        groups,
        measure,
        macros,
        description: description.trim() || undefined,
      }
      await foodRepo.saveCustom(food)
      if (afiFilled.current) track('afi_suggestion_accepted', { kind: 'menu' })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onSaved?.(food)
      onClose()
    } catch {
      setSaveError('Besini kaydedemedik. Bağlantını kontrol edip tekrar dene.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const confirmRemove = () => {
    if (initial?.id === undefined) return
    Alert.alert('Menüden silinsin mi?', `“${initial.name}” menünden kaldırılacak.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void foodRepo.removeCustom(initial.id!).then(onClose)
        },
      },
    ])
  }

  const inputStyle: TextStyle = {
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: t.ink,
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        if (!saving) onClose()
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-surface"
        style={{ paddingTop: Platform.OS === 'android' ? insets.top : 0 }}
      >
        {/* Başlık — sabit */}
        <View className="flex-row items-center justify-between border-b border-line/60 px-5 pb-3 pt-4">
          <View className="flex-row items-center gap-2">
            <IconBookmarkPlus size={22} color={isDark ? '#34d399' : '#059669'} />
            <AppText weight="bold" className="text-lg text-ink">
              {editing ? 'Besini Düzenle' : 'Menüne Kaydet'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={onClose}
            className={`rounded-full bg-muted px-3 py-1 ${saving ? 'opacity-40' : ''}`}
          >
            <AppText className="text-sm text-soft">Kapat</AppText>
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: 16 }}
        >
      <AppText weight="semibold" className="mb-2 text-sm text-soft">
        Besin adı
      </AppText>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="örn. babaannemin dolması"
        placeholderTextColor={t.faint}
        style={inputStyle}
      />

      {/* Afi — birincil yol: adı yaz, gerisini Afi doldursun. Ayrıntılar
          öneri gelince açılır (kademeli açılım) */}
      <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
        <Afi size={42} />
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className="text-sm text-emerald-900 dark:text-emerald-100">
            {afiBusy ? 'Afi düşünüyor…' : 'Gerisini Afi doldursun ✨'}
          </AppText>
          <AppText className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-200/90">
            {afiBusy
              ? 'Yaklaşık değerleri hazırlıyor, birazdan burada.'
              : hasName
                ? 'Grup, ölçü ve yaklaşık değerleri önerir; hepsini düzenleyebilirsin.'
                : 'Önce besinin adını yaz.'}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Afi formu doldursun"
          onPress={() => void askAfi()}
          disabled={!hasName || afiBusy}
          className={`shrink-0 flex-row items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 ${
            !hasName || afiBusy ? 'opacity-40' : ''
          }`}
        >
          {afiBusy ? <ActivityIndicator size="small" color="#ffffff" /> : null}
          <AppText weight="bold" className="text-xs text-white">
            {afiBusy ? 'Hazırlıyor' : 'Doldur'}
          </AppText>
        </Pressable>
      </View>

      {/* Fotoğraftan tanıt: kamera ve galeri iki ayrı yol; tanınan besin
          düzenlenebilir biçimde forma düşer */}
      <View className="mt-2 flex-row items-center gap-2">
        <AppText className="text-xs text-soft">ya da fotoğraftan:</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fotoğraf çek"
          onPress={() => void takePhoto()}
          disabled={afiBusy}
          className={`h-10 w-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50 ${
            afiBusy ? 'opacity-40' : ''
          }`}
        >
          <IconCamera size={20} color={isDark ? '#34d399' : '#059669'} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Galeriden seç"
          onPress={() => void chooseFromLibrary()}
          disabled={afiBusy}
          className={`h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface ${
            afiBusy ? 'opacity-40' : ''
          }`}
        >
          <IconImage size={20} color={t.soft} />
        </Pressable>
      </View>

      {photoNote ? (
        <AppText className="mt-2 text-xs leading-relaxed text-faint">{photoNote}</AppText>
      ) : null}

      {!detailsOpen && !afiBusy ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Değerleri elle girmek için ayrıntıları aç"
          onPress={() => setDetailsOpen(true)}
          className="mt-2 items-center py-2"
        >
          <AppText weight="semibold" className="text-xs text-faint">
            Değerleri kendim girmek istiyorum
          </AppText>
        </Pressable>
      ) : null}

      {detailsOpen ? (
        <>
          <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
            Besin grubu
          </AppText>
      <View className="flex-row flex-wrap gap-2">
        {visibleGroups.map((g) => (
          <Chip
            key={g.key}
            label={g.label}
            icon={
              <GroupIcon
                group={g.key}
                size={18}
                color={groups.includes(g.key) ? '#ffffff' : undefined}
              />
            }
            active={groups.includes(g.key)}
            onPress={() => toggleGroup(g.key)}
          />
        ))}
        {hiddenGroupCount > 0 ? (
          <Chip label={`+${String(hiddenGroupCount)} daha`} onPress={() => setGroupsExpanded(true)} />
        ) : null}
        {groupsExpanded ? (
          <Chip label="daha az göster" onPress={() => setGroupsExpanded(false)} />
        ) : null}
      </View>

      <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
        Ölçü
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {FOOD_MEASURES.map((m) => (
          <Chip key={m.key} label={m.label} active={measure === m.key} onPress={() => setMeasure(m.key)} />
        ))}
      </View>

      <AppText weight="semibold" className="mt-4 text-sm text-soft">
        1 {measureMeta(measure).label} için yaklaşık değerler
      </AppText>
      <AppText className="mb-2 text-xs text-faint">
        Günlük enerji ve makro pusulana sayılır; Afi'nin önerisini düzenleyebilirsin.
      </AppText>
      <View className="flex-row flex-wrap justify-between" style={{ rowGap: 8 }}>
        {MACRO_FIELDS.map((f) => (
          <View key={f.key} className="w-[48.5%] rounded-xl border border-line bg-surface px-3 py-2">
            <AppText weight="semibold" className="text-[11px] text-faint">
              {f.label} ({f.unit})
            </AppText>
            <TextInput
              value={macroText[f.key]}
              onChangeText={(v) => setMacroText((prev) => ({ ...prev, [f.key]: v }))}
              placeholder="0"
              placeholderTextColor={t.faint}
              keyboardType="decimal-pad"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: 18,
                color: t.ink,
                paddingVertical: 2,
              }}
            />
          </View>
        ))}
      </View>

      <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
        Besin bilgisi
      </AppText>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="İsteğe bağlı kısa not; örn. tam buğday unuyla, az yağlı…"
        placeholderTextColor={t.faint}
        multiline
        style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
      />
        </>
      ) : null}
        </ScrollView>

        {/* Kaydet çubuğu — sabit alt bar */}
        <View
          className="border-t border-line/60 px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
      <View className="flex-row items-center gap-2">
        {editing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Besini menüden sil"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={confirmRemove}
            className={`h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 ${saving ? 'opacity-40' : ''}`}
          >
            <IconTrash size={20} color={isDark ? '#f87171' : '#dc2626'} />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave || saving, busy: saving }}
          onPress={() => void save()}
          disabled={!canSave || saving}
          className={`flex-1 items-center rounded-xl bg-emerald-600 py-3.5 ${!canSave || saving ? 'opacity-40' : ''}`}
        >
          <AppText weight="semibold" className="text-white">
            {saving ? 'Kaydediliyor…' : editing ? 'Kaydet' : 'Menüne Kaydet'}
          </AppText>
        </Pressable>
      </View>
      {saveError ? (
        <AppText selectable className="mt-2 text-center text-sm text-soft">
          {saveError}
        </AppText>
      ) : null}
      {!canSave ? (
        <AppText className="mt-2 text-center text-xs text-faint">
          Kaydetmek için grup ve yaklaşık değerler gerekli; Afi'ye bırakabilirsin.
        </AppText>
      ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
