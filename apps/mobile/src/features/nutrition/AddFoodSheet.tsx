import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  MEAL_TYPES,
  SEED_FOODS,
  findSeedFood,
  mealMeta,
  measureMeta,
  searchSeedFoods,
  turkishLower,
  type FoodGroup,
  type FoodMeasure,
  type MealEntry,
  type MealType,
} from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import { AppState, Pressable, View } from 'react-native'
import { mealRepo } from '../../data/repositories'
import { useLiveValue } from '../../data/useLive'
import { FirstLogCelebration } from '../ftue/FirstLogCelebration'
import { ftueSeen, markFtueSeen } from '../ftue/ftueFlags'
import { AfiPhotoSheet } from './AfiPhotoSheet'
import { CustomFoodSheet } from './CustomFoodSheet'
import { canSaveMealEntry } from './mealEntryValidation'
import { resolveMealEntryDate } from './mealEntryDate'
import { useCustomFoods } from './useCustomFoods'
import { tokens, useTheme } from '@/theme/useTheme'
import { track } from '@/lib/track'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconBookmarkPlus, IconCamera, IconMinus, IconPlus, IconX } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/* Native meal entry sheet, including the one-time first-log celebration. */

interface AddFoodSheetProps {
  profileId: number
  date: string
  open: boolean
  /** A preset meal hides the picker; null lets the user select one. */
  meal: MealType | null
  initialEntry?: MealEntry
  onClose: () => void
}

const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const QTY_STEP = 0.5
const QTY_MIN = 0.5
const QTY_MAX = 12

/** Picks a reasonable default meal when opening the sheet from the dashboard. */
function guessMealByTime(): MealType {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'kahvalti'
  if (h >= 11 && h < 15) return 'ogle'
  if (h >= 15 && h < 17) return 'ara'
  if (h >= 17 && h < 22) return 'aksam'
  return 'ara'
}

export function AddFoodSheet({
  profileId,
  date,
  open,
  meal,
  initialEntry,
  onClose,
}: AddFoodSheetProps) {
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
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [entryDate, setEntryDate] = useState(date)
  const savingRef = useRef(false)
  // The first-log celebration opens once with the saved food name.
  const [celebrating, setCelebrating] = useState<string | null>(null)
  // Saves an unknown food to the user's menu.
  const [defining, setDefining] = useState(false)
  // Adds a meal from an Afi photo analysis.
  const [afiPhotoOpen, setAfiPhotoOpen] = useState(false)
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null)

  useEffect(() => {
    if (open) {
      setEntryDate(resolveMealEntryDate(initialEntry?.date))
      setSelectedMeal(initialEntry?.meal ?? meal ?? guessMealByTime())
      setName(initialEntry?.foodName ?? '')
      setGroups(initialEntry?.groups ?? [])
      setMeasure(initialEntry?.measure ?? 'porsiyon')
      setQty(initialEntry?.quantity ?? 1)
      setAutoMatched(initialEntry !== undefined)
      setShowAllGroups(false)
      setTouched(false)
      setSaveError(null)
    }
  }, [initialEntry, meal, open])

  useEffect(() => {
    if (!open || initialEntry) return
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setEntryDate(resolveMealEntryDate())
    })
    return () => subscription.remove()
  }, [initialEntry, open])

  const customFoods = useCustomFoods()

  // Shows the current meal's existing foods while adding another one.
  const mealEntries =
    useLiveValue(
      ['meals'],
      () =>
        open && !initialEntry
          ? mealRepo.forDay(profileId, entryDate).then((es) => es.filter((e) => e.meal === selectedMeal))
          : Promise.resolve([]),
      [profileId, entryDate, open, selectedMeal, initialEntry],
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
    setSaveError(null)
    setTouched(true)
    setShowAllGroups(false)
    // Exact matches populate food groups and measurement metadata.
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
    if (!canSaveMealEntry(trimmed, groups)) return false
    const saveDate = resolveMealEntryDate(initialEntry?.date)
    setEntryDate(saveDate)
    if (initialEntry?.id !== undefined) {
      await mealRepo.update(initialEntry.id, {
        profileId,
        date: saveDate,
        meal: selectedMeal,
        foodName: trimmed,
        portionSize: initialEntry.portionSize,
        quantity: qty,
        measure,
        groups,
        note: initialEntry.note,
      })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      return true
    }
    // Celebrate only the actual first meal log, not an existing installation.
    const firstEver =
      !ftueSeen('firstMealCelebrated') && (await mealRepo.loggedDates(profileId)).length === 0
    await mealRepo.add({
      profileId,
      date: saveDate,
      meal: selectedMeal,
      foodName: trimmed,
      quantity: qty,
      measure,
      groups,
      createdAt: new Date().toISOString(),
    })
    track('meal_logged', {
      meal: selectedMeal,
      group_count: groups.length,
      source: findSeedFood(trimmed) ? 'seed' : 'custom',
    })
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    if (!ftueSeen('firstMealCelebrated')) {
      markFtueSeen('firstMealCelebrated')
      if (firstEver) setCelebrating(trimmed)
    }
    return true
  }

  const runSave = async (closeAfterSave: boolean) => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    setSaveError(null)
    try {
      if (!(await saveEntry())) return
      resetFood()
      if (closeAfterSave) onClose()
      else inputRef.current?.focus()
    } catch {
      setSaveError('Öğünü kaydedemedik. Bağlantını kontrol edip tekrar dene.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const hasName = name.trim().length > 0
  const canSave = canSaveMealEntry(name, groups)
  const suggestionsOpen = touched && suggestions.length > 0
  // Unknown foods expose editable metadata so every saved meal can affect balance.
  const showDetailSection = hasName && !suggestionsOpen
  const showDefineButton = hasName && !autoMatched
  const editingDetails = showAllGroups || !autoMatched
  // Catalog foods start with their matched groups; unknown foods show every option.
  const visibleGroups = editingDetails
    ? FOOD_GROUPS
    : FOOD_GROUPS.filter((g) => groups.includes(g.key))

  return (
    <>
    <Sheet
      open={open}
      onClose={() => {
        if (saving) return
        resetFood()
        onClose()
      }}
      heightRatio={0.85}
      title={
        <>
          <MealIcon meal={selectedMeal} size={22} />
          <AppText weight="bold" className="text-lg text-ink">
            {initialEntry
              ? 'Öğünü Düzenle'
              : meal
                ? `${mealMeta(meal).label} — Besin Ekle`
                : 'Besin Ekle'}
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
          {!initialEntry && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fotoğrafla ekle: Afi tanısın"
              onPress={() => setAfiPhotoOpen(true)}
              className="h-11 w-11 items-center justify-center rounded-xl bg-emerald-600"
            >
              <IconCamera size={22} color="#ffffff" />
            </Pressable>
          )}
          {showDefineButton && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Besini menüne kaydet"
              onPress={() => setDefining(true)}
              className="h-11 w-11 items-center justify-center rounded-xl bg-muted"
            >
              <IconBookmarkPlus size={22} color={t.soft} />
            </Pressable>
          )}
        </View>
        {showDefineButton && !suggestionsOpen && (
          <AppText className="mt-1.5 text-xs text-faint">
            Bu besin listede yok; yer imiyle menüne ekle ya da fotoğrafını çek, Afi tanısın.
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
              {editingDetails ? 'Besin grubu seç' : 'Besin grubu'}
            </AppText>
            {!editingDetails && (
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
                onPress={editingDetails ? () => toggleGroup(g.key) : undefined}
              />
            ))}
          </View>

          {editingDetails && (
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

      {hasName && !suggestionsOpen && groups.length === 0 ? (
        <AppText
          selectable
          accessibilityLiveRegion="polite"
          className="mb-3 text-center text-sm text-soft"
        >
          Kaydetmek için en az bir besin grubu seç.
        </AppText>
      ) : null}

      {saveError ? (
        <AppText selectable className="mb-3 text-center text-sm text-soft">
          {saveError}
        </AppText>
      ) : null}

      <View className="flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave || saving, busy: saving }}
          onPress={() => void runSave(true)}
          disabled={!canSave || saving}
          className={`flex-1 items-center rounded-xl bg-emerald-600 py-3.5 ${
            !canSave || saving ? 'opacity-40' : ''
          }`}
        >
          <AppText weight="semibold" className="text-white">
            {saving ? 'Kaydediliyor…' : initialEntry ? 'Değişiklikleri Kaydet' : 'Kaydet'}
          </AppText>
        </Pressable>
        {!initialEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave || saving, busy: saving }}
            onPress={() => void runSave(false)}
            disabled={!canSave || saving}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-600 bg-surface py-3.5 dark:border-emerald-500 ${
              !canSave || saving ? 'opacity-40' : ''
            }`}
          >
            <IconPlus size={18} color={isDark ? '#34d399' : '#047857'} strokeWidth={2.4} />
            <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-400">
              {saving ? 'Kaydediliyor…' : 'Bir Besin Daha'}
            </AppText>
          </Pressable>
        )}
      </View>
    </Sheet>

    {/* Full-screen Afi photo entry flow. */}
    <AfiPhotoSheet
      open={afiPhotoOpen}
      profileId={profileId}
      date={entryDate}
      meal={selectedMeal}
      hint={name.trim() || undefined}
      onClose={() => setAfiPhotoOpen(false)}
    />

    {/* Defines an unknown food above the main sheet. */}
    <CustomFoodSheet
      open={defining}
      initial={defining ? { name: name.trim(), groups, measure } : null}
      onClose={() => setDefining(false)}
      onSaved={(f) => {
        // The saved food now has metadata and can use the quantity controls.
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
