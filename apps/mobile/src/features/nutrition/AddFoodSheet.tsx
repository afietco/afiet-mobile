import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  MEAL_TYPES,
  SEED_FOODS,
  addDays,
  findSeedFood,
  formatMealAmount,
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
import { createRestoredMealEntry } from './meal-remove-undo'
import {
  MEAL_SHORTCUT_HISTORY_DAYS,
  entriesForMeal,
  recentMealShortcuts,
  repeatMealEntries,
} from './meal-shortcuts'
import { useCustomFoods } from './useCustomFoods'
import { tokens, useTheme } from '@/theme/useTheme'
import { track } from '@/lib/track'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconBookmarkPlus, IconCamera, IconMinus, IconPlus, IconRepeat, IconX } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/* Native meal entry sheet, including the one-time first-log celebration. */

interface AddFoodSheetProps {
  profileId: number
  date: string
  open: boolean
  /** A preset meal selects the initial chip; the user can always change it. */
  meal: MealType | null
  /** Requires an explicit chip selection when a deep link has no valid meal. */
  requireMealSelection?: boolean
  initialEntry?: MealEntry
  onClose: () => void
}

const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const QTY_STEP = 0.5
const QTY_MIN = 0.5
const QTY_MAX = 12
const FOOD_NAME_MAX_LENGTH = 80
const UNDO_REMOVE_DURATION_MS = 6_000
const EMPTY_MEAL_ENTRIES: MealEntry[] = []

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
  requireMealSelection = false,
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
  const [mealSelectionConfirmed, setMealSelectionConfirmed] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [removedEntry, setRemovedEntry] = useState<MealEntry | null>(null)
  const [undoingRemove, setUndoingRemove] = useState(false)
  const [repeatingYesterday, setRepeatingYesterday] = useState(false)
  const [entryDate, setEntryDate] = useState(date)
  const savingRef = useRef(false)
  const undoRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // The first-log celebration opens once with the saved food name.
  const [celebrating, setCelebrating] = useState<string | null>(null)
  // Saves an unknown food to the user's menu.
  const [defining, setDefining] = useState(false)
  // Adds a meal from an Afi photo analysis.
  const [afiPhotoOpen, setAfiPhotoOpen] = useState(false)
  const inputRef = useRef<ComponentRef<typeof BottomSheetTextInput>>(null)

  useEffect(() => {
    if (open && !requireMealSelection) inputRef.current?.focus()
  }, [open, requireMealSelection])

  useEffect(
    () => () => {
      if (undoRemoveTimerRef.current !== null) clearTimeout(undoRemoveTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    if (open) {
      setEntryDate(resolveMealEntryDate(initialEntry?.date))
      setSelectedMeal(initialEntry?.meal ?? meal ?? guessMealByTime())
      setMealSelectionConfirmed(initialEntry !== undefined || !requireMealSelection)
      setName(initialEntry?.foodName ?? '')
      setGroups(initialEntry?.groups ?? [])
      setMeasure(initialEntry?.measure ?? 'porsiyon')
      setQty(initialEntry?.quantity ?? 1)
      setAutoMatched(initialEntry !== undefined)
      setShowAllGroups(false)
      setTouched(false)
      setSaveError(null)
    }
  }, [initialEntry, meal, open, requireMealSelection])

  useEffect(() => {
    if (!open || initialEntry) return
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setEntryDate(resolveMealEntryDate())
    })
    return () => subscription.remove()
  }, [initialEntry, open])

  const customFoods = useCustomFoods()

  // One range read powers current entries, recent shortcuts, and yesterday repeat.
  const shortcutHistory =
    useLiveValue(
      ['meals'],
      () =>
        open && !initialEntry
          ? mealRepo.forRange(
              profileId,
              addDays(entryDate, -MEAL_SHORTCUT_HISTORY_DAYS),
              entryDate,
            )
          : Promise.resolve([]),
      [profileId, entryDate, open, initialEntry],
    ) ?? EMPTY_MEAL_ENTRIES
  const mealEntries = entriesForMeal(shortcutHistory, entryDate, selectedMeal)
  const recentEntries = useMemo(() => recentMealShortcuts(shortcutHistory), [shortcutHistory])
  const yesterdayDate = addDays(entryDate, -1)
  const yesterdayEntries = entriesForMeal(shortcutHistory, yesterdayDate, selectedMeal)

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

  const pickRecentEntry = (entry: MealEntry) => {
    pickSuggestion({ name: entry.foodName, groups: entry.groups, measure: entry.measure })
    setQty(entry.quantity)
    setSaveError(null)
    inputRef.current?.focus()
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

  const chooseMeal = (nextMeal: MealType) => {
    setSelectedMeal(nextMeal)
    setMealSelectionConfirmed(true)
    setSaveError(null)
    inputRef.current?.focus()
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

  const offerRemoveUndo = (entry: MealEntry) => {
    if (undoRemoveTimerRef.current !== null) clearTimeout(undoRemoveTimerRef.current)
    setRemovedEntry(entry)
    undoRemoveTimerRef.current = setTimeout(() => {
      setRemovedEntry(null)
      undoRemoveTimerRef.current = null
    }, UNDO_REMOVE_DURATION_MS)
  }

  const removeEntry = async (entry: MealEntry) => {
    if (entry.id === undefined || deletingId !== null) return
    setDeletingId(entry.id)
    setSaveError(null)
    try {
      await mealRepo.remove(entry.id)
      offerRemoveUndo(entry)
      void Haptics.selectionAsync()
    } catch {
      setSaveError('Kaydı kaldıramadık. Birazdan tekrar deneyebilirsin.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setDeletingId(null)
    }
  }

  const undoRemove = async () => {
    const entry = removedEntry
    if (!entry || undoingRemove) return
    if (undoRemoveTimerRef.current !== null) clearTimeout(undoRemoveTimerRef.current)
    undoRemoveTimerRef.current = null
    setUndoingRemove(true)
    setSaveError(null)
    try {
      await mealRepo.add(createRestoredMealEntry(entry))
      setRemovedEntry(null)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      offerRemoveUndo(entry)
      setSaveError('Kaydı geri getiremedik. Birazdan tekrar deneyebilirsin.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setUndoingRemove(false)
    }
  }

  const repeatYesterdayMeal = async () => {
    if (!mealSelectionConfirmed || repeatingYesterday || yesterdayEntries.length === 0) return
    setRepeatingYesterday(true)
    setSaveError(null)
    try {
      const targetDate = resolveMealEntryDate()
      const sourceDate = addDays(targetDate, -1)
      const sourceEntries =
        sourceDate === yesterdayDate
          ? yesterdayEntries
          : entriesForMeal(
              await mealRepo.forDay(profileId, sourceDate),
              sourceDate,
              selectedMeal,
            )
      if (sourceEntries.length === 0) {
        setSaveError('Dünkü bu öğünde tekrarlanacak bir kayıt bulamadık.')
        return
      }
      await repeatMealEntries(mealRepo, sourceEntries, {
        profileId,
        date: targetDate,
        meal: selectedMeal,
        createdAt: new Date().toISOString(),
      })
      for (const entry of sourceEntries) {
        track('meal_logged', {
          meal: selectedMeal,
          group_count: entry.groups.length,
          source: 'yesterday_repeat',
        })
      }
      setEntryDate(targetDate)
      resetFood()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onClose()
    } catch {
      setSaveError('Dünkü öğünü tekrarlayamadık. Bağlantını kontrol edip tekrar dene.')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setRepeatingYesterday(false)
    }
  }

  const saveEntry = async () => {
    const trimmed = name.trim()
    if (!mealSelectionConfirmed || !canSaveMealEntry(trimmed, groups)) return false
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
    if (savingRef.current || repeatingYesterday) return
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
  const canSave = mealSelectionConfirmed && canSaveMealEntry(name, groups)
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
        if (saving || repeatingYesterday) return
        resetFood()
        onClose()
      }}
      heightRatio={0.85}
      title={
        <>
          {mealSelectionConfirmed ? <MealIcon meal={selectedMeal} size={22} /> : null}
          <AppText weight="bold" className="text-lg text-ink">
            {initialEntry
              ? 'Öğünü Düzenle'
              : mealSelectionConfirmed
                ? `${mealMeta(selectedMeal).label} — Besin Ekle`
                : 'Öğün seç — Besin Ekle'}
          </AppText>
        </>
      }
    >
      <View className="mb-4 flex-row flex-wrap gap-2">
        {MEAL_TYPES.map((m) => (
          <Chip
            key={m.key}
            label={m.label}
            icon={
              <MealIcon
                meal={m.key}
                size={18}
                color={mealSelectionConfirmed && selectedMeal === m.key ? '#ffffff' : undefined}
              />
            }
            active={mealSelectionConfirmed && selectedMeal === m.key}
            onPress={() => chooseMeal(m.key)}
          />
        ))}
      </View>

      {!mealSelectionConfirmed ? (
        <AppText accessibilityLiveRegion="polite" className="mb-4 text-sm text-soft">
          Kaydın doğru yere düşmesi için öğününü seç.
        </AppText>
      ) : null}

      {mealSelectionConfirmed && yesterdayEntries.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Dünkü öğünü ${yesterdayEntries.length} besinle tekrarla`}
          accessibilityState={{ disabled: repeatingYesterday, busy: repeatingYesterday }}
          disabled={repeatingYesterday}
          onPress={() => void repeatYesterdayMeal()}
          className={`mb-4 min-h-11 flex-row items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2.5 active:opacity-80 dark:bg-emerald-950/60 ${
            repeatingYesterday ? 'opacity-40' : ''
          }`}
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/60">
            <IconRepeat size={19} color={isDark ? '#34d399' : '#047857'} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
              {repeatingYesterday ? 'Dünkü öğün ekleniyor…' : 'Dünkü öğünü tekrarla'}
            </AppText>
            <AppText numberOfLines={1} className="text-xs text-emerald-700 dark:text-emerald-300">
              {yesterdayEntries.map((entry) => entry.foodName).join(' · ')}
            </AppText>
          </View>
          <AppText weight="bold" className="text-xs text-emerald-700 dark:text-emerald-300">
            {yesterdayEntries.length} besin
          </AppText>
        </Pressable>
      ) : null}

      {recentEntries.length > 0 ? (
        <View className="mb-4 gap-2">
          <AppText weight="bold" className="text-sm text-soft">
            Son eklenenler
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {recentEntries.map((entry) => (
              <Pressable
                key={`${entry.id ?? entry.createdAt}-${entry.foodName}`}
                accessibilityRole="button"
                accessibilityLabel={`${entry.foodName}, ${formatMealAmount(entry)} seç`}
                onPress={() => pickRecentEntry(entry)}
                className="min-h-11 max-w-full flex-row items-center gap-1 rounded-full border border-line bg-surface px-3 py-2 active:opacity-80"
              >
                <AppText numberOfLines={1} className="min-w-0 shrink text-sm text-ink">
                  {entry.foodName}
                </AppText>
                <AppText className="shrink-0 text-xs text-soft">
                  · {formatMealAmount(entry)}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {mealSelectionConfirmed && mealEntries.length > 0 && (
        <View className="mb-4 flex-row flex-wrap gap-1.5 rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/60">
          {mealEntries.map((e) => (
            <View
              key={e.id}
              className="max-w-full flex-row items-center gap-1 rounded-full bg-surface px-2.5 py-1"
            >
              <AppText
                numberOfLines={1}
                className="min-w-0 shrink text-sm text-emerald-800 dark:text-emerald-200"
              >
                {e.foodName}
              </AppText>
              <AppText className="shrink-0 text-xs text-soft">
                · {formatMealAmount(e)}
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
                accessibilityState={{
                  disabled: deletingId !== null,
                  busy: deletingId === e.id,
                }}
                disabled={deletingId !== null}
                onPress={() => void removeEntry(e)}
                className={`-mr-2 ml-0.5 h-11 w-11 items-center justify-center rounded-full active:bg-muted ${
                  deletingId !== null ? 'opacity-40' : ''
                }`}
              >
                <IconX size={16} color={t.faint} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {removedEntry ? (
        <View
          accessibilityLiveRegion="polite"
          className="mb-4 flex-row items-center gap-3 rounded-2xl bg-muted px-3 py-2"
        >
          <AppText selectable numberOfLines={2} className="min-w-0 flex-1 text-sm text-soft">
            “{removedEntry.foodName}” kaldırıldı.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${removedEntry.foodName} kaydını geri al`}
            accessibilityState={{ disabled: undoingRemove, busy: undoingRemove }}
            disabled={undoingRemove}
            onPress={() => void undoRemove()}
            className={`h-11 items-center justify-center rounded-xl bg-surface px-4 active:opacity-80 ${
              undoingRemove ? 'opacity-40' : ''
            }`}
          >
            <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-400">
              {undoingRemove ? 'Geri alınıyor…' : 'Geri al'}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      <View className="mb-4">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <BottomSheetTextInput
              ref={inputRef}
              autoFocus={!requireMealSelection}
              value={name}
              onChangeText={onNameChange}
              maxLength={FOOD_NAME_MAX_LENGTH}
              numberOfLines={1}
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
              accessibilityState={{ disabled: !mealSelectionConfirmed }}
              disabled={!mealSelectionConfirmed}
              onPress={() => setAfiPhotoOpen(true)}
              className={`h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 ${
                !mealSelectionConfirmed ? 'opacity-40' : ''
              }`}
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
                <AppText numberOfLines={1} className="min-w-0 flex-1 text-sm text-ink">
                  {s.name}
                </AppText>
                <View className="shrink-0 flex-row items-center gap-1">
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
          accessibilityState={{
            disabled: !canSave || saving || repeatingYesterday,
            busy: saving || repeatingYesterday,
          }}
          onPress={() => void runSave(true)}
          disabled={!canSave || saving || repeatingYesterday}
          className={`flex-1 items-center rounded-xl bg-emerald-600 py-3.5 ${
            !canSave || saving || repeatingYesterday ? 'opacity-40' : ''
          }`}
        >
          <AppText weight="semibold" className="text-white">
            {saving ? 'Kaydediliyor…' : initialEntry ? 'Değişiklikleri Kaydet' : 'Kaydet'}
          </AppText>
        </Pressable>
        {!initialEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{
              disabled: !canSave || saving || repeatingYesterday,
              busy: saving || repeatingYesterday,
            }}
            onPress={() => void runSave(false)}
            disabled={!canSave || saving || repeatingYesterday}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-600 bg-surface py-3.5 dark:border-emerald-500 ${
              !canSave || saving || repeatingYesterday ? 'opacity-40' : ''
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
