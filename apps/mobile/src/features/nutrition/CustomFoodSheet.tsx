import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  measureMeta,
  type CustomFood,
  type FoodGroup,
  type FoodMeasure,
  type Macros,
} from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Alert, Pressable, View, type TextStyle } from 'react-native'
import { foodRepo } from '../../data/repositories'
import { Afi } from '@/ui/Afi'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconBookmarkPlus, IconTrash } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/**
 * Menü besini pop-up'ı — listede olmayan bir besini grup, ölçü, makro ve
 * kısa bilgiyle kaydeder; Menüm ekranından düzenleme/silme de buradan.
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
  }, [open, initial])

  const editing = initial?.id !== undefined
  const hasName = name.trim().length > 0

  const toggleGroup = (g: FoodGroup) => {
    void Haptics.selectionAsync()
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    // En az bir makro girildiyse boş kalanlar 0 kabul edilir
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
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onSaved?.(food)
    onClose()
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
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconBookmarkPlus size={22} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="bold" className="text-lg text-ink">
            {editing ? 'Besini Düzenle' : 'Menüne Kaydet'}
          </AppText>
        </>
      }
    >
      <AppText weight="semibold" className="mb-2 text-sm text-soft">
        Besin adı
      </AppText>
      <BottomSheetTextInput
        value={name}
        onChangeText={setName}
        placeholder="örn. babaannemin dolması"
        placeholderTextColor={t.faint}
        style={inputStyle}
      />

      <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
        Besin grubu
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {FOOD_GROUPS.map((g) => (
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
      </View>

      <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
        Ölçü
      </AppText>
      <View className="flex-row flex-wrap gap-2">
        {FOOD_MEASURES.map((m) => (
          <Chip key={m.key} label={m.label} active={measure === m.key} onPress={() => setMeasure(m.key)} />
        ))}
      </View>

      {/* Afi — yapay zekâ yardımcısı; şimdilik yalnızca tanıtım (yakında) */}
      <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
        <Afi size={42} />
        <View className="min-w-0 flex-1">
          <AppText weight="bold" className="text-sm text-emerald-900 dark:text-emerald-100">
            Afi yardım edecek ✨
          </AppText>
          <AppText className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-200/90">
            Makroları ve besin bilgisini bilmiyorsan dert etme — Afi senin yerine dolduracak.
          </AppText>
        </View>
        <View className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1">
          <AppText weight="bold" className="text-[10px] uppercase tracking-wide text-white">
            Yakında
          </AppText>
        </View>
      </View>

      <AppText weight="semibold" className="mt-4 text-sm text-soft">
        1 {measureMeta(measure).label} için yaklaşık değerler
      </AppText>
      <AppText className="mb-2 text-xs text-faint">
        İsteğe bağlı — girersen günlük enerji ve makro pusulana sayılır.
      </AppText>
      <View className="flex-row flex-wrap justify-between" style={{ rowGap: 8 }}>
        {MACRO_FIELDS.map((f) => (
          <View key={f.key} className="w-[48.5%] rounded-xl border border-line bg-surface px-3 py-2">
            <AppText weight="semibold" className="text-[11px] text-faint">
              {f.label} ({f.unit})
            </AppText>
            <BottomSheetTextInput
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
      <BottomSheetTextInput
        value={description}
        onChangeText={setDescription}
        placeholder="İsteğe bağlı kısa not — örn. tam buğday unuyla, az yağlı…"
        placeholderTextColor={t.faint}
        multiline
        style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
      />

      <View className="mt-5 flex-row items-center gap-2">
        {editing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Besini menüden sil"
            onPress={confirmRemove}
            className="h-12 w-12 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
          >
            <IconTrash size={20} color={isDark ? '#f87171' : '#dc2626'} />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => void save()}
          disabled={!hasName}
          className={`flex-1 items-center rounded-xl bg-emerald-600 py-3.5 ${!hasName ? 'opacity-40' : ''}`}
        >
          <AppText weight="semibold" className="text-white">
            {editing ? 'Kaydet' : 'Menüne Kaydet'}
          </AppText>
        </Pressable>
      </View>
    </Sheet>
  )
}
