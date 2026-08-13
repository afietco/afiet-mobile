import { FOOD_GROUPS, mealMeta, measureMeta, type FoodGroup, type FoodMeasure } from '@afiet/core'
// Not from the barrel: @afiet/core/macros reaches the seed catalogue, and the
// barrel deliberately keeps that off every screen's first frame. This step is
// already inside the catalogue-loading flow, so the entry point costs nothing.
import { allowedMeasures } from '@afiet/core/macros'
import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { isDraftResolved, type AfiCue, type DetailsStepProps } from './contract'
import { convertQuantity, nudgeQuantity, quantityRange } from './quantity'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconMinus, IconPlus } from '@/ui/icons'

/**
 * Third step of the add-food flow: confirm what the food is made of.
 *
 * Everything that reaches this step is already resolved: a catalogue row, a
 * menu row, a food Afi read out of a sentence. There used to be a second
 * arrival, a bare name walked here to be described and filled in by a separate
 * suggestion agent, and it is gone: an unknown food now goes to Afi in the
 * photo-and-chat screen, which writes its own entry. One assistant, one screen,
 * and this step no longer opens locked behind a form.
 *
 * The measure row is deliberately short. Macros are written for ONE measure of
 * a food, and the only conversion the catalogue can actually do is grams
 * (`allowedMeasures` / `measureServings` in @afiet/core). Offering all nine
 * measures let somebody pick "kaşık" on a per-portion dish and get three whole
 * portions counted against their day, which is a number nobody ate.
 *
 * There is no confirm checkbox and no back control here; the host owns both the
 * way back and the save itself.
 */

const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

export function FoodDetailsStep({
  draft,
  onDraft,
  onCue,
  meal,
  saving,
  queued,
  onSkip,
  error,
  onSave,
}: DetailsStepProps) {
  // `onAdvance` is deliberately unused: details is the last step and the save
  // action ends the flow.
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  /** Reveals every group chip for a food that arrived knowing its own. */
  const [showAllGroups, setShowAllGroups] = useState(false)

  // The host owns the draft and may hand back a new callback every render;
  // refs keep the effects below from firing on identity alone.
  const draftRef = useRef(onDraft)
  const cueRef = useRef(onCue)
  useEffect(() => {
    draftRef.current = onDraft
    cueRef.current = onCue
  })

  /* The food's own measure is whatever it walked in with; grams join it only
     when the catalogue knows what one measure weighs. Captured on arrival so
     switching to grams does not then offer grams as the base. */
  const [baseMeasure] = useState<FoodMeasure>(() => draft.measure)
  const measures = useMemo(
    () => allowedMeasures(baseMeasure, draft.gramPerMeasure),
    [baseMeasure, draft.gramPerMeasure],
  )

  const cue = useMemo<AfiCue>(() => {
    if (saving) return { pose: 'kutlama', line: 'Afiyet olsun! 🧡' }
    return { pose: 'buldum', line: 'Bunu tanıyorum; ne kadar yediğini söylemen yeter.' }
  }, [saving])

  useEffect(() => {
    cueRef.current(cue)
  }, [cue])

  const toggleGroup = useCallback(
    (group: FoodGroup) => {
      void Haptics.selectionAsync()
      draftRef.current({
        groups: draft.groups.includes(group)
          ? draft.groups.filter((g) => g !== group)
          : [...draft.groups, group],
      })
    },
    [draft.groups],
  )

  /* Changing measure carries the amount with it: one portion asked for in
     grams is that portion's weight, not one gram. */
  const chooseMeasure = useCallback(
    (measure: FoodMeasure) => {
      if (measure === draft.measure) return
      void Haptics.selectionAsync()
      draftRef.current({
        measure,
        quantity: convertQuantity(draft.quantity, draft.measure, measure, draft.gramPerMeasure),
      })
    },
    [draft.gramPerMeasure, draft.measure, draft.quantity],
  )

  const nudgeQty = useCallback(
    (direction: 1 | -1) => {
      void Haptics.selectionAsync()
      const next = nudgeQuantity(draft.quantity, draft.measure, direction)
      if (next !== draft.quantity) draftRef.current({ quantity: next })
    },
    [draft.measure, draft.quantity],
  )

  // A known food shows only its own groups until the user asks for the rest.
  const editingGroups = showAllGroups || draft.groups.length === 0
  const groupOptions = useMemo(
    () => (editingGroups ? FOOD_GROUPS : FOOD_GROUPS.filter((g) => draft.groups.includes(g.key))),
    [draft.groups, editingGroups],
  )

  const canSave = isDraftResolved(draft)

  const handleSave = (andAnother = false) => {
    if (!canSave || saving) return
    /* The write itself is `meal_logged`; this is the button, and the flag says
       whether the visit was meant to end here. */
    trackTap('addfood_save', { again: andAnother })
    onSave(andAnother)
  }

  return (
    <View>
      <View className="mb-4 flex-row items-center gap-2">
        <MealIcon meal={meal} size={18} />
        <AppText className="min-w-0 flex-1 text-sm text-soft">
          {mealMeta(meal).label} öğününe yazılacak.
        </AppText>
      </View>

      <View className="mb-4">
        <AppText weight="bold" numberOfLines={2} className="text-lg text-ink">
          {draft.name}
        </AppText>
      </View>

      <View className="mb-2 flex-row items-center justify-between">
        <AppText weight="semibold" className="text-sm text-soft">
          {editingGroups ? 'Besin grubu seç' : 'Besin grubu'}
        </AppText>
        {!editingGroups ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Besin gruplarını düzenle"
            onPress={() => setShowAllGroups(true)}
            className="min-h-11 justify-center"
          >
            <AppText weight="semibold" className="text-xs text-emerald-600 dark:text-emerald-400">
              Düzenle
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <GroupGrid options={groupOptions} selected={draft.groups} onToggle={toggleGroup} />

      {/* A single allowed measure is a fact about the food, not a choice: it is
          stated rather than offered, so nobody hunts for the other options. */}
      <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
        Ölçü
      </AppText>
      {measures.length > 1 ? (
        <MeasureRow measures={measures} measure={draft.measure} onSelect={chooseMeasure} />
      ) : (
        <AppText className="text-sm text-ink">{measureMeta(draft.measure).label}</AppText>
      )}

      <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
        {measureMeta(draft.measure).ask}
      </AppText>
      <QuantityStepper
        quantity={draft.quantity}
        measure={draft.measure}
        color={t.soft}
        onNudge={nudgeQty}
      />

      {error ? (
        <AppText
          selectable
          accessibilityLiveRegion="polite"
          className="mt-4 text-center text-sm text-soft"
        >
          {error}
        </AppText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSave || saving, busy: saving }}
        disabled={!canSave || saving}
        onPress={() => handleSave(false)}
        className={`mt-5 min-h-11 items-center rounded-xl bg-emerald-600 py-3.5 ${
          !canSave || saving ? 'opacity-40' : ''
        }`}
      >
        <AppText weight="semibold" className="text-white">
          {saving ? 'Kaydediliyor…' : queued > 0 ? 'Kaydet ve devam et' : 'Kaydet'}
        </AppText>
      </Pressable>

      {/* While a sentence is being walked through, the second button is the way
          past a food rather than the way to another one: the next food is
          already known, and offering an empty search here would abandon it. */}
      {queued > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bunu ekleme, sıradakine geç"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={() => {
            trackTap('addfood_skip_item')
            onSkip()
          }}
          className={`mt-2 min-h-11 items-center rounded-xl border border-line py-3 ${
            saving ? 'opacity-40' : ''
          }`}
        >
          <AppText weight="semibold" className="text-soft">
            Bunu ekleme
          </AppText>
        </Pressable>
      ) : (
        /* One meal is usually several foods. Saving one does not have to end the
           visit: this keeps the meal and comes back with an empty search. */
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kaydet ve bir besin daha ekle"
          accessibilityState={{ disabled: !canSave || saving }}
          disabled={!canSave || saving}
          onPress={() => handleSave(true)}
          className={`mt-2 min-h-11 items-center rounded-xl border border-emerald-600 py-3 ${
            !canSave || saving ? 'opacity-40' : ''
          }`}
        >
          <AppText weight="semibold" className="text-emerald-700 dark:text-emerald-300">
            Kaydet ve bir daha ekle
          </AppText>
        </Pressable>
      )}

      {!canSave && !saving ? (
        <AppText className="mt-2 text-center text-xs leading-relaxed text-faint">
          Kaydetmek için en az bir besin grubu seçili olsun.
        </AppText>
      ) : null}
    </View>
  )
}

/**
 * The group board. Memoized on purpose: quantity and measure taps re-render
 * the step, and this grid has twelve icons in it.
 */
const GroupGrid = memo(function GroupGrid({
  options,
  selected,
  onToggle,
}: {
  options: typeof FOOD_GROUPS
  selected: FoodGroup[]
  onToggle?: (group: FoodGroup) => void
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((group) => (
        <Chip
          key={group.key}
          label={group.label}
          icon={
            <GroupIcon
              group={group.key}
              size={18}
              color={selected.includes(group.key) ? '#ffffff' : undefined}
            />
          }
          active={selected.includes(group.key)}
          onPress={onToggle ? () => onToggle(group.key) : undefined}
        />
      ))}
    </View>
  )
})

const MeasureRow = memo(function MeasureRow({
  measures,
  measure,
  onSelect,
}: {
  measures: FoodMeasure[]
  measure: FoodMeasure
  onSelect: (measure: FoodMeasure) => void
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {measures.map((option) => (
        <Chip
          key={option}
          label={measureMeta(option).label}
          active={measure === option}
          onPress={() => onSelect(option)}
        />
      ))}
    </View>
  )
})

const QuantityStepper = memo(function QuantityStepper({
  quantity,
  measure,
  color,
  onNudge,
}: {
  quantity: number
  measure: FoodMeasure
  color: string
  onNudge: (direction: 1 | -1) => void
}) {
  const range = quantityRange(measure)
  const atMin = quantity <= range.min
  const atMax = quantity >= range.max
  return (
    <View className="flex-row items-center gap-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Miktarı azalt"
        accessibilityState={{ disabled: atMin }}
        disabled={atMin}
        onPress={() => onNudge(-1)}
        className={`h-11 w-11 items-center justify-center rounded-full bg-muted ${
          atMin ? 'opacity-40' : ''
        }`}
      >
        <IconMinus size={20} color={color} strokeWidth={2.4} />
      </Pressable>
      <AppText weight="bold" className="min-w-24 text-center text-lg text-ink">
        {numQty.format(quantity)}{' '}
        <AppText weight="semibold" className="text-sm text-soft">
          {measureMeta(measure).label}
        </AppText>
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Miktarı artır"
        accessibilityState={{ disabled: atMax }}
        disabled={atMax}
        onPress={() => onNudge(1)}
        className={`h-11 w-11 items-center justify-center rounded-full bg-muted ${
          atMax ? 'opacity-40' : ''
        }`}
      >
        <IconPlus size={20} color={color} strokeWidth={2.4} />
      </Pressable>
    </View>
  )
})
