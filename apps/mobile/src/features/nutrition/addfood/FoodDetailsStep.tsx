import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  mealMeta,
  measureMeta,
  type FoodGroup,
  type FoodMeasure,
} from '@afiet/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, View, type TextStyle } from 'react-native'
import {
  CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH,
  CUSTOM_FOOD_NAME_MAX_LENGTH,
  limitCustomFoodDescription,
  limitCustomFoodName,
} from '../customFoodLimits'
import {
  isAfiFillReady,
  rememberFilledMenuFood,
  requestAfiFill,
} from './afiFill'
import { isDraftResolved, type AfiCue, type DetailsStepProps } from './contract'
import { track } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { Chip } from '@/ui/Chip'
import { IconLock, IconMinus, IconPlus } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

/**
 * Third step of the add-food flow: confirm what the food is made of.
 *
 * Two arrivals meet here. A food the search step resolved (catalogue, menu or
 * an Afi photo reading) already knows its groups, so the step only shows them
 * and lets the amount be adjusted. A food nobody knows yet arrives with a bare
 * name and goes through Afi: name plus a short "besin bilgisi" first, then
 * "Afi doldur", and only once that fill has actually landed do the group,
 * measure and quantity controls open up. Locking them is not gatekeeping for
 * its own sake: an entry without real group data cannot move the balance, and
 * the flow refuses to write one (see `isDraftResolved`).
 *
 * There is no confirm checkbox and no back control here; the host owns both
 * the way back and the save itself.
 */

const QTY_STEP = 0.5
const QTY_MIN = 0.5
const QTY_MAX = 12
const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

/** Where the Afi fill stands. Idle covers "still collecting" and "ready". */
type FillState = 'idle' | 'filling' | 'filled' | 'failed'

/** The fill card's own two lines, one pair per state of the request. */
function fillFace(state: FillState, ready: boolean): { title: string; hint: string } {
  if (state === 'filling') {
    return { title: 'Afi düşünüyor…', hint: 'Yazdıklarına bakıyorum, birazdan burada.' }
  }
  if (state === 'filled') {
    return {
      title: 'Doldurdum ✨',
      hint: 'Aşağısı artık açık; dilediğin gibi düzenleyebilirsin.',
    }
  }
  if (state === 'failed') {
    return {
      title: 'Şu an ulaşamadım',
      hint: 'Bağlantını kontrol edip tekrar deneyebilirsin.',
    }
  }
  return ready
    ? {
        title: 'Hazırım, doldurayım mı?',
        hint: 'Grup ve ölçüyü ben getireyim; hepsi düzenlenebilir kalır.',
      }
    : {
        title: 'Gerisini Afi doldursun ✨',
        hint: 'Adını yaz, altına da birkaç kelimeyle ne olduğunu anlat.',
      }
}

export function FoodDetailsStep({
  draft,
  onDraft,
  onCue,
  meal,
  saving,
  error,
  onSave,
}: DetailsStepProps) {
  // `onAdvance` is deliberately unused: details is the last step and the save
  // action ends the flow.
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  // How the food walked in, captured once: catalogue, menu, photo and a
  // bookmark that was already filled elsewhere all arrive knowing what they
  // are made of. Only a bare name needs Afi. Reading this per render instead
  // would turn a known food into an unknown one the moment its last group
  // chip was unchecked.
  const [knownOnArrival] = useState(() => draft.origin !== null && draft.groups.length > 0)
  const fillMode = !knownOnArrival

  const [name, setName] = useState(() => limitCustomFoodName(draft.name))
  const [description, setDescription] = useState('')
  const [fillState, setFillState] = useState<FillState>('idle')
  /** Reveals every group chip for an already known food. */
  const [showAllGroups, setShowAllGroups] = useState(false)

  const trimmedName = name.trim()
  const fillReady = useMemo(
    () => isAfiFillReady({ name, description }),
    [description, name],
  )
  const unlocked = !fillMode || fillState === 'filled'
  const locked = !unlocked

  // The host owns the draft and may hand back a new callback every render;
  // refs keep the effects below from firing on identity alone.
  const draftRef = useRef(onDraft)
  const cueRef = useRef(onCue)
  useEffect(() => {
    draftRef.current = onDraft
    cueRef.current = onCue
  })

  // The name input holds its own state so typing never re-renders the grid;
  // the draft catches up one tick later, long before any save press.
  useEffect(() => {
    if (fillMode && trimmedName !== draft.name) draftRef.current({ name: trimmedName })
  }, [draft.name, fillMode, trimmedName])

  const cue = useMemo<AfiCue>(() => {
    if (saving) return { pose: 'kutlama', line: 'Afiyet olsun! 🧡' }
    if (!fillMode) {
      return { pose: 'buldum', line: 'Bunu tanıyorum; ne kadar yediğini söylemen yeter.' }
    }
    if (fillState === 'filling') {
      return { pose: 'dusunuyor', line: 'Yazdıklarına bakıyorum, birazdan burada.' }
    }
    if (fillState === 'filled') {
      return { pose: 'buldum', line: 'Buldum! İstersen düzenle, sonra kaydedelim.' }
    }
    if (fillState === 'failed') {
      return { pose: 'cevrimdisi', line: 'Şu an ulaşamadım; hazır olduğunda tekrar deneyelim.' }
    }
    return fillReady
      ? { pose: 'merak', line: '“Afi doldur”a dokun, gerisini ben yazayım.' }
      : { pose: 'merak', line: 'Adını ve birkaç kelimeyle ne olduğunu yaz.' }
  }, [fillMode, fillReady, fillState, saving])

  useEffect(() => {
    cueRef.current(cue)
  }, [cue])

  const runFill = useCallback(async () => {
    if (!fillReady || fillState === 'filling') return
    setFillState('filling')
    track('afi_assist_used', { kind: 'details' })
    try {
      const filled = await requestAfiFill({ name: trimmedName, description })
      if (filled.groups.length === 0) {
        // An empty answer is not a filling: leaving it locked is honest.
        setFillState('failed')
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        return
      }
      draftRef.current({
        name: trimmedName,
        groups: filled.groups,
        measure: filled.measure,
        origin: 'bookmark',
      })
      // The draft has no room for a note or approximate values; the host
      // consumes this when it saves (see afiFill.ts).
      rememberFilledMenuFood({
        name: trimmedName,
        groups: filled.groups,
        measure: filled.measure,
        macros: filled.macros,
        description: description.trim() || filled.description,
      })
      setFillState('filled')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      setFillState('failed')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }, [description, fillReady, fillState, trimmedName])

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

  const chooseMeasure = useCallback((measure: FoodMeasure) => {
    void Haptics.selectionAsync()
    draftRef.current({ measure })
  }, [])

  const nudgeQty = useCallback(
    (direction: 1 | -1) => {
      void Haptics.selectionAsync()
      const next = Math.min(
        QTY_MAX,
        Math.max(QTY_MIN, draft.quantity + direction * QTY_STEP),
      )
      if (next !== draft.quantity) draftRef.current({ quantity: next })
    },
    [draft.quantity],
  )

  // A known food shows only its own groups until the user asks for the rest;
  // a filled one shows the whole board because everything is editable now.
  const editingGroups = fillMode || showAllGroups || draft.groups.length === 0
  const groupOptions = useMemo(
    () => (editingGroups ? FOOD_GROUPS : FOOD_GROUPS.filter((g) => draft.groups.includes(g.key))),
    [draft.groups, editingGroups],
  )

  const canSave = unlocked && isDraftResolved(draft) && trimmedName.length > 0

  const handleSave = () => {
    if (!canSave || saving) return
    if (fillMode && fillState === 'filled') track('afi_suggestion_accepted', { kind: 'details' })
    onSave()
  }

  const inputStyle: TextStyle = {
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: t.surface,
    fontFamily: 'Nunito_400Regular',
    // Font size belongs in style, never in a text-* class: NativeWind's line
    // height clips the value on iOS.
    fontSize: 16,
    color: t.ink,
  }
  const face = fillFace(fillState, fillReady)
  const fillLabel =
    fillState === 'filling'
      ? 'Dolduruyorum…'
      : fillState === 'failed'
        ? 'Tekrar dene'
        : fillState === 'filled'
          ? 'Yeniden doldur'
          : 'Afi doldur'

  return (
    <View>
      <View className="mb-4 flex-row items-center gap-2">
        <MealIcon meal={meal} size={18} />
        <AppText className="min-w-0 flex-1 text-sm text-soft">
          {mealMeta(meal).label} öğününe yazılacak.
        </AppText>
      </View>

      {fillMode ? (
        <View className="mb-4 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/50">
          {/* Afi itself is the flow guide above this card, so the card does not
              repeat the figure; it changes its wording with Afi's stance and
              carries the small mascot on the action Afi performs. */}
          <AppText weight="bold" className="text-sm text-emerald-900 dark:text-emerald-100">
            {face.title}
          </AppText>
          <AppText className="text-xs leading-relaxed text-emerald-800/90 dark:text-emerald-200/90">
            {face.hint}
          </AppText>

          <AppText
            weight="semibold"
            className="mb-1.5 mt-3 text-xs text-emerald-900/80 dark:text-emerald-100/80"
          >
            Besin adı
          </AppText>
          <BottomSheetTextInput
            value={name}
            onChangeText={(value) => setName(limitCustomFoodName(value))}
            maxLength={CUSTOM_FOOD_NAME_MAX_LENGTH}
            accessibilityLabel="Besin adı"
            placeholder="örn. babaannemin dolması"
            placeholderTextColor={t.faint}
            style={inputStyle}
          />

          <AppText
            weight="semibold"
            className="mb-1.5 mt-3 text-xs text-emerald-900/80 dark:text-emerald-100/80"
          >
            Besin bilgisi
          </AppText>
          <BottomSheetTextInput
            value={description}
            onChangeText={(value) => setDescription(limitCustomFoodDescription(value))}
            maxLength={CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH}
            accessibilityLabel="Besin bilgisi"
            placeholder="Neyden yapılmış? örn. zeytinyağlı, içi pirinçli"
            placeholderTextColor={t.faint}
            multiline
            style={[inputStyle, { minHeight: 68, textAlignVertical: 'top' }]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Afi doldursun"
            accessibilityState={{
              disabled: !fillReady || fillState === 'filling',
              busy: fillState === 'filling',
            }}
            disabled={!fillReady || fillState === 'filling'}
            onPress={() => void runFill()}
            className={`mt-3 min-h-11 flex-row items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 ${
              !fillReady || fillState === 'filling' ? 'opacity-40' : ''
            }`}
          >
            {fillState === 'filling' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              // Afi wakes up on the button the moment the gate opens: mini pose
              // for this size, dark tone because the ground is emerald.
              <AfiPose
                pose="mini"
                tone="dark"
                motion={fillReady ? 'nabiz' : 'yok'}
                size={22}
              />
            )}
            <AppText weight="bold" className="text-sm text-white">
              {fillLabel}
            </AppText>
          </Pressable>

          {!fillReady ? (
            <AppText
              accessibilityLiveRegion="polite"
              className="mt-1.5 text-center text-[11px] leading-relaxed text-emerald-800/80 dark:text-emerald-200/80"
            >
              Ad ve besin bilgisi dolunca “Afi doldur” açılır.
            </AppText>
          ) : null}
        </View>
      ) : (
        <View className="mb-4">
          <AppText weight="bold" numberOfLines={2} className="text-lg text-ink">
            {draft.name}
          </AppText>
        </View>
      )}

      <View
        className={locked ? 'rounded-2xl border border-dashed border-line px-3 pb-3 pt-2.5' : ''}
      >
        {locked ? (
          <View className="mb-2.5 flex-row items-center gap-2">
            <IconLock size={15} color={t.faint} />
            <AppText
              accessibilityLiveRegion="polite"
              className="min-w-0 flex-1 text-xs leading-relaxed text-faint"
            >
              Grup, ölçü ve miktar Afi doldurunca açılır.
            </AppText>
          </View>
        ) : null}

        <View
          pointerEvents={locked ? 'none' : 'auto'}
          accessibilityElementsHidden={locked}
          importantForAccessibility={locked ? 'no-hide-descendants' : 'auto'}
          className={locked ? 'opacity-40' : ''}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <AppText weight="semibold" className="text-sm text-soft">
              {editingGroups && !locked ? 'Besin grubu seç' : 'Besin grubu'}
            </AppText>
            {!editingGroups ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Besin gruplarını düzenle"
                onPress={() => setShowAllGroups(true)}
                className="min-h-11 justify-center"
              >
                <AppText
                  weight="semibold"
                  className="text-xs text-emerald-600 dark:text-emerald-400"
                >
                  Düzenle
                </AppText>
              </Pressable>
            ) : null}
          </View>
          <GroupGrid
            options={groupOptions}
            selected={draft.groups}
            onToggle={locked ? undefined : toggleGroup}
          />

          <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
            Ölçü
          </AppText>
          <MeasureRow measure={draft.measure} onSelect={locked ? undefined : chooseMeasure} />

          <AppText weight="semibold" className="mb-2 mt-4 text-sm text-soft">
            {measureMeta(draft.measure).ask}
          </AppText>
          <QuantityStepper
            quantity={draft.quantity}
            measure={draft.measure}
            color={t.soft}
            onNudge={locked ? undefined : nudgeQty}
          />
        </View>
      </View>

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
        onPress={handleSave}
        className={`mt-5 min-h-11 items-center rounded-xl bg-emerald-600 py-3.5 ${
          !canSave || saving ? 'opacity-40' : ''
        }`}
      >
        <AppText weight="semibold" className="text-white">
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </AppText>
      </Pressable>

      {!canSave && !saving ? (
        <AppText className="mt-2 text-center text-xs leading-relaxed text-faint">
          {locked
            ? 'Afi doldurunca kaydedebilirsin.'
            : 'Kaydetmek için en az bir besin grubu seçili olsun.'}
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
  measure,
  onSelect,
}: {
  measure: FoodMeasure
  onSelect?: (measure: FoodMeasure) => void
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {FOOD_MEASURES.map((option) => (
        <Chip
          key={option.key}
          label={option.label}
          active={measure === option.key}
          onPress={onSelect ? () => onSelect(option.key) : undefined}
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
  onNudge?: (direction: 1 | -1) => void
}) {
  const atMin = quantity <= QTY_MIN
  const atMax = quantity >= QTY_MAX
  return (
    <View className="flex-row items-center gap-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Miktarı azalt"
        accessibilityState={{ disabled: !onNudge || atMin }}
        disabled={!onNudge || atMin}
        onPress={() => onNudge?.(-1)}
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
        accessibilityState={{ disabled: !onNudge || atMax }}
        disabled={!onNudge || atMax}
        onPress={() => onNudge?.(1)}
        className={`h-11 w-11 items-center justify-center rounded-full bg-muted ${
          atMax ? 'opacity-40' : ''
        }`}
      >
        <IconPlus size={20} color={color} strokeWidth={2.4} />
      </Pressable>
    </View>
  )
})
