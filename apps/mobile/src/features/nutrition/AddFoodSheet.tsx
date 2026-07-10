import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  MEAL_TYPES,
  SEED_FOODS,
  mealMeta,
  measureMeta,
  searchSeedFoods,
  turkishLower,
  type FoodGroup,
  type FoodMeasure,
  type MealType,
} from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import { Pressable, View } from 'react-native'
import { foodRepo, mealRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { FirstLogCelebration } from '../ftue/FirstLogCelebration'
import { ftueSeen, markFtueSeen } from '../ftue/ftueFlags'
import { CustomFoodSheet } from './CustomFoodSheet'
import { useCustomFoods } from './useCustomFoods'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconBookmarkPlus, IconMinus, IconPlus, IconX } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/* Web AddFoodSheet.tsx portu — ilk kayıt kutlaması (konfeti) dahil. */

interface AddFoodSheetProps {
  profileId: number
  date: string
  open: boolean
  /** Önceden seçili öğün; null → sheet içinde öğün seçici gösterilir */
  meal: MealType | null
  onClose: () => void
}

const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const QTY_STEP = 0.5
const QTY_MIN = 0.5
const QTY_MAX = 12

/** Saate göre makul öğün varsayımı — dashboard'dan eklerken önseçim */
function guessMealByTime(): MealType {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'kahvalti'
  if (h >= 11 && h < 15) return 'ogle'
  if (h >= 15 && h < 17) return 'ara'
  if (h >= 17 && h < 22) return 'aksam'
  return 'ara'
}

export function AddFoodSheet({ profileId, date, open, meal, onClose }: AddFoodSheetProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [name, setName] = useState('')
  const [groups, setGroups] = useState<FoodGroup[]>([])
  const [measure, setMeasure] = useState<FoodMeasure>('porsiyon')
  const [qty, setQty] = useState(1)
  const [autoMatched, setAutoMatched] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [touched, setTouched] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealType>('kahvalti')
  // İlk besin kaydı kutlaması — kaydedilen besin adıyla bir kez açılır
  const [celebrating, setCelebrating] = useState<string | null>(null)
  // Listede olmayan besini menüne kaydetme pop-up'ı
  const [defining, setDefining] = useState(false)
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null)

  // Açılışta öğünü belirle: önseçili öğün ya da saate göre tahmin
  useEffect(() => {
    if (open) setSelectedMeal(meal ?? guessMealByTime())
  }, [open, meal])

  const customFoods = useCustomFoods()

  // Bu öğüne bugüne kadar eklenmiş besinler — sheet üstünde gösterilir
  const mealEntries =
    useLive(
      ['meals'],
      () =>
        open
          ? mealRepo.forDay(profileId, date).then((es) => es.filter((e) => e.meal === selectedMeal))
          : Promise.resolve([]),
      [profileId, date, open, selectedMeal],
    ) ?? []

  const suggestions = useMemo(() => {
    const q = turkishLower(name.trim())
    if (!q) return []
    const custom = customFoods
      .filter((f) => turkishLower(f.name).includes(q))
      .map((f) => ({ name: f.name, groups: f.groups, measure: f.measure }))
    const seed = searchSeedFoods(name, 6)
    const seen = new Set<string>()
    return [...custom, ...seed]
      .filter((f) => {
        const key = turkishLower(f.name)
        if (seen.has(key) || key === q) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
  }, [name, customFoods])

  const pickSuggestion = (s: { name: string; groups: FoodGroup[]; measure?: FoodMeasure }) => {
    setName(s.name)
    setGroups(s.groups)
    setMeasure(s.measure ?? 'porsiyon')
    setAutoMatched(true)
    setShowAllGroups(false)
    setTouched(false)
  }

  const onNameChange = (value: string) => {
    setName(value)
    setTouched(true)
    setShowAllGroups(false)
    // Tam eşleşme varsa grupları ve ölçüyü otomatik doldur
    const exact =
      SEED_FOODS.find((f) => turkishLower(f.name) === turkishLower(value.trim())) ??
      customFoods.find((f) => turkishLower(f.name) === turkishLower(value.trim()))
    if (exact) {
      setGroups(exact.groups)
      setMeasure(exact.measure ?? 'porsiyon')
      setAutoMatched(true)
    } else {
      setGroups([])
      setMeasure('porsiyon')
      setAutoMatched(false)
    }
  }

  const toggleGroup = (g: FoodGroup) => {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const resetFood = () => {
    setName('')
    setGroups([])
    setMeasure('porsiyon')
    setQty(1)
    setAutoMatched(false)
    setShowAllGroups(false)
    setTouched(false)
  }

  const nudgeQty = (dir: 1 | -1) => {
    void Haptics.selectionAsync()
    setQty((q) => Math.min(QTY_MAX, Math.max(QTY_MIN, q + dir * QTY_STEP)))
  }

  const saveEntry = async () => {
    const trimmed = name.trim()
    if (!trimmed) return false
    // Kutlama yalnızca gerçekten ilk kayıtta — eski verisi olan kurulumda atlanır
    const firstEver =
      !ftueSeen('firstMealCelebrated') && (await mealRepo.loggedDates(profileId)).length === 0
    await mealRepo.add({
      profileId,
      date,
      meal: selectedMeal,
      foodName: trimmed,
      quantity: qty,
      measure,
      groups,
      createdAt: new Date().toISOString(),
    })
    // Menü yalnızca bilinçli tanımlarla dolsun: eşleşen besinin grup/ölçü
    // düzenlemesi öğrenilir, bilinmeyen besin pop-up ile kaydedilir
    if (autoMatched) await foodRepo.learn(trimmed, groups, measure)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    if (!ftueSeen('firstMealCelebrated')) {
      markFtueSeen('firstMealCelebrated')
      if (firstEver) setCelebrating(trimmed)
    }
    return true
  }

  const save = async () => {
    if (await saveEntry()) {
      resetFood()
      onClose()
    }
  }

  const saveAndNext = async () => {
    if (await saveEntry()) {
      resetFood()
      inputRef.current?.focus()
    }
  }

  const hasName = name.trim().length > 0
  const suggestionsOpen = touched && suggestions.length > 0
  // Grup/ölçü/miktar yalnızca eşleşen (listedeki) besinde görünür;
  // bilinmeyen besinde onların yerine "menüne kaydet" düğmesi çıkar
  const showDetailSection = hasName && !suggestionsOpen && autoMatched
  const showDefineButton = hasName && !autoMatched
  // Varsayılan: yalnızca besinin ilişkili grupları; "Düzenle" ile tümü
  const visibleGroups = showAllGroups
    ? FOOD_GROUPS
    : FOOD_GROUPS.filter((g) => groups.includes(g.key))

  return (
    <>
    <Sheet
      open={open}
      onClose={() => {
        resetFood()
        onClose()
      }}
      heightRatio={0.85}
      title={
        <>
          <MealIcon meal={selectedMeal} size={22} />
          <AppText weight="bold" className="text-lg text-ink">
            {meal ? `${mealMeta(meal).label} — Besin Ekle` : 'Besin Ekle'}
          </AppText>
        </>
      }
    >
      {meal === null && (
        <View className="mb-4 flex-row flex-wrap gap-2">
          {MEAL_TYPES.map((m) => (
            <Chip
              key={m.key}
              label={m.label}
              icon={
                <MealIcon
                  meal={m.key}
                  size={18}
                  color={selectedMeal === m.key ? '#ffffff' : undefined}
                />
              }
              active={selectedMeal === m.key}
              onPress={() => setSelectedMeal(m.key)}
            />
          ))}
        </View>
      )}

      {mealEntries.length > 0 && (
        <View className="mb-4 flex-row flex-wrap gap-1.5 rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/60">
          {mealEntries.map((e) => (
            <View
              key={e.id}
              className="flex-row items-center gap-1 rounded-full bg-surface px-2.5 py-1"
            >
              <AppText className="text-sm text-emerald-800 dark:text-emerald-200">
                {e.foodName}
              </AppText>
              {e.groups.length > 0 && (
                <View className="flex-row items-center gap-0.5">
                  {e.groups.map((g) => (
                    <GroupIcon key={g} group={g} size={14} />
                  ))}
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${e.foodName} kaydını sil`}
                hitSlop={6}
                onPress={() => {
                  void Haptics.selectionAsync()
                  void mealRepo.remove(e.id!)
                }}
                className="-mr-1 ml-0.5 rounded-full p-0.5"
              >
                <IconX size={13} color={t.faint} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className="mb-4">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <BottomSheetTextInput
              ref={inputRef}
              value={name}
              onChangeText={onNameChange}
              placeholder="Ne yedin? (örn. mercimek çorbası)"
              placeholderTextColor={t.faint}
              style={{
                borderWidth: 1,
                borderColor: t.line,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontFamily: 'Nunito_400Regular',
                fontSize: 16,
                color: t.ink,
              }}
            />
          </View>
          {showDefineButton && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Besini menüne kaydet"
              onPress={() => setDefining(true)}
              className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-600"
            >
              <IconBookmarkPlus size={22} color="#ffffff" />
            </Pressable>
          )}
        </View>
        {showDefineButton && !suggestionsOpen && (
          <AppText className="mt-1.5 text-xs text-faint">
            Bu besin listede yok — yandaki düğmeyle menüne kaydedebilirsin.
          </AppText>
        )}
        {suggestionsOpen && (
          <View className="mt-1 overflow-hidden rounded-xl border border-line bg-surface">
            {suggestions.map((s, i) => (
              <Pressable
                key={s.name}
                accessibilityRole="button"
                onPress={() => pickSuggestion(s)}
                className={`flex-row items-center justify-between px-4 py-2.5 ${
                  i > 0 ? 'border-t border-line/40' : ''
                }`}
              >
                <AppText className="text-sm text-ink">{s.name}</AppText>
                <View className="flex-row items-center gap-1">
                  {s.groups.map((g) => (
                    <GroupIcon key={g} group={g} size={16} />
                  ))}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {showDetailSection && (
        <View>
          <View className="mb-2 flex-row items-center justify-between">
            <AppText weight="semibold" className="text-sm text-soft">
              {!showAllGroups ? 'Besin grubu' : 'Besin grubu seç'}
            </AppText>
            {!showAllGroups && (
              <Pressable accessibilityRole="button" onPress={() => setShowAllGroups(true)}>
                <AppText weight="semibold" className="text-xs text-emerald-600 dark:text-emerald-400">
                  Düzenle
                </AppText>
              </Pressable>
            )}
          </View>
          <View className="mb-4 flex-row flex-wrap gap-2">
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
                onPress={!showAllGroups ? undefined : () => toggleGroup(g.key)}
              />
            ))}
          </View>

          {showAllGroups && (
            <>
              <AppText weight="semibold" className="mb-2 text-sm text-soft">
                Ölçü seç
              </AppText>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {FOOD_MEASURES.map((m) => (
                  <Chip
                    key={m.key}
                    label={m.label}
                    active={measure === m.key}
                    onPress={() => setMeasure(m.key)}
                  />
                ))}
              </View>
            </>
          )}

          <AppText weight="semibold" className="mb-2 text-sm text-soft">
            {measureMeta(measure).ask}
          </AppText>
          <View className="mb-6 flex-row items-center gap-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Miktarı azalt"
              onPress={() => nudgeQty(-1)}
              disabled={qty <= QTY_MIN}
              className={`h-10 w-10 items-center justify-center rounded-full bg-muted ${
                qty <= QTY_MIN ? 'opacity-40' : ''
              }`}
            >
              <IconMinus size={20} color={t.soft} strokeWidth={2.4} />
            </Pressable>
            <AppText weight="bold" className="min-w-24 text-center text-lg text-ink">
              {numQty.format(qty)}{' '}
              <AppText weight="semibold" className="text-sm text-soft">
                {measureMeta(measure).label}
              </AppText>
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Miktarı artır"
              onPress={() => nudgeQty(1)}
              disabled={qty >= QTY_MAX}
              className={`h-10 w-10 items-center justify-center rounded-full bg-muted ${
                qty >= QTY_MAX ? 'opacity-40' : ''
              }`}
            >
              <IconPlus size={20} color={t.soft} strokeWidth={2.4} />
            </Pressable>
          </View>
        </View>
      )}

      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={() => void save()}
          disabled={!hasName}
          className={`flex-1 items-center rounded-xl bg-emerald-600 py-3.5 ${
            !hasName ? 'opacity-40' : ''
          }`}
        >
          <AppText weight="semibold" className="text-white">
            Kaydet
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void saveAndNext()}
          disabled={!hasName}
          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-600 bg-surface py-3.5 dark:border-emerald-500 ${
            !hasName ? 'opacity-40' : ''
          }`}
        >
          <IconPlus size={18} color={isDark ? '#34d399' : '#047857'} strokeWidth={2.4} />
          <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-400">
            Bir Besin Daha
          </AppText>
        </Pressable>
      </View>
    </Sheet>

    {/* Bilinmeyen besini tanıtma pop-up'ı — ana sheet'in üstünde açılır */}
    <CustomFoodSheet
      open={defining}
      initial={defining ? { name: name.trim(), groups, measure } : null}
      onClose={() => setDefining(false)}
      onSaved={(f) => {
        // Kaydedilen besin artık "listede": grup/ölçü işlensin, miktar sorulsun
        setName(f.name)
        setGroups(f.groups)
        setMeasure(f.measure ?? 'porsiyon')
        setAutoMatched(true)
        setShowAllGroups(false)
        setTouched(false)
      }}
    />

    {celebrating !== null && (
      <FirstLogCelebration foodName={celebrating} onClose={() => setCelebrating(null)} />
    )}
    </>
  )
}
