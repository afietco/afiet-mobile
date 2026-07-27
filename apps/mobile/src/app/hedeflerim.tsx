import {
  addDays,
  calculateGoals,
  todayISO,
  type GoalDirection,
  type Measurement,
} from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useCallback, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mealRepo, measurementRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { AcquaintanceMeter, type AcquaintanceFacts } from '@/features/goals/AcquaintanceMeter'
import { DirectionPicker } from '@/features/goals/DirectionPicker'
import { HandMeasures } from '@/features/goals/HandMeasures'
import { NumbersSection } from '@/features/goals/NumbersSection'
import { useGoalDirection } from '@/features/goals/useGoalDirection'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconTarget } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * Hedeflerim: where the daily measures come from, and what points them.
 *
 * Not a tracker. The Beslenme tab answers "what did I eat today"; this screen
 * answers "where do my measures come from". So it reads as a short story in
 * four beats: the direction that shapes them, how well Afi knows the person
 * yet, the measures themselves in hand language, and only then, folded away,
 * the grams and the kcal.
 *
 * Every number on screen comes from the goal engine (`calculateGoals`). This
 * file selects data and lays it out; it does not compute a target, a weight or
 * a date. There is no target weight and no time projection anywhere in this
 * product (docs/hedeflerim.md, sections 2 and 12).
 */

/** Window the "steady logging" invitation looks back over (doc section 4.7). */
const STEADY_WINDOW_DAYS = 14

/**
 * Days of that window that count as steady. The calibration gate of section 4.7
 * also asks for three meals on each of those days; this meter is an invitation
 * rather than a gate, so a day with any record counts. Being generous here can
 * only make the meter warmer, never stricter than the calibration it precedes.
 */
const STEADY_LOG_DAYS = 10

const SAVE_ERROR = 'Yönünü kaydedemedim. Bağlantını kontrol edip tekrar dener misin?'
const LOAD_ERROR = 'Yönünü şu an okuyamadım; şimdilik dengede tutuyorum.'

/** The most recent measurement carrying the girths the body fat estimate needs. */
function latestWithGirths(measurements: readonly Measurement[]): Measurement | undefined {
  for (let index = measurements.length - 1; index >= 0; index -= 1) {
    const measurement = measurements[index]
    if (measurement.waistCm != null && measurement.neckCm != null) return measurement
  }
  return undefined
}

export default function HedeflerimScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const today = todayISO()

  const { id: profileId, profile, error: profileError, retry: retryProfile } = useActiveProfile()
  const measurementsQuery = useLive(
    ['measurements'],
    () => (profileId ? measurementRepo.forProfile(profileId) : Promise.resolve([])),
    [profileId],
  )
  const loggedDatesQuery = useLive(
    ['meals'],
    () => (profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId],
  )
  const goalDirection = useGoalDirection(today)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const measurements = measurementsQuery.data
  const latest = measurements?.at(-1)
  const girths = measurements ? latestWithGirths(measurements) : undefined
  const { direction, isDefault } = goalDirection

  // The engine is the only place a number is produced, and it runs once per
  // meaningful change rather than once per render: the screen reads live data
  // and re-renders on every notification from the meal and measurement tables.
  const goals = useMemo(
    () =>
      calculateGoals({
        sex: profile?.sex,
        birthDate: profile?.birthDate,
        heightCm: profile?.heightCm,
        weightKg: latest?.weightKg,
        activityLevel: profile?.activityLevel,
        measurements: girths
          ? { waistCm: girths.waistCm, neckCm: girths.neckCm, hipCm: girths.hipCm }
          : undefined,
        // An unchosen direction is passed as absent, not as `duzen`, so the
        // engine knows to keep the numeric target muted.
        direction: isDefault ? undefined : direction,
      }),
    [
      profile?.sex,
      profile?.birthDate,
      profile?.heightCm,
      profile?.activityLevel,
      latest?.weightKg,
      girths,
      direction,
      isDefault,
    ],
  )

  const chooseDirection = useCallback(
    async (next: GoalDirection) => {
      setSaving(true)
      setSaveError(null)
      try {
        await goalDirection.choose(next)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } catch {
        setSaveError(SAVE_ERROR)
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      } finally {
        setSaving(false)
      }
    },
    [goalDirection],
  )

  if (!profileId || !profile) return <PageSkeleton error={profileError} onRetry={retryProfile} />
  if (measurements === undefined)
    return <PageSkeleton error={measurementsQuery.error} onRetry={measurementsQuery.retry} />
  if (loggedDatesQuery.data === undefined)
    return <PageSkeleton error={loggedDatesQuery.error} onRetry={loggedDatesQuery.retry} />
  if (goalDirection.loading) return <PageSkeleton />

  const windowStart = addDays(today, -(STEADY_WINDOW_DAYS - 1))
  const steadyDays = new Set(
    loggedDatesQuery.data.filter((date) => date >= windowStart && date <= today),
  ).size

  const missing = new Set(goals.missingInputs)
  const facts: AcquaintanceFacts = {
    basics:
      !missing.has('sex') &&
      !missing.has('age') &&
      !missing.has('heightCm') &&
      profile.activityLevel != null,
    firstWeight: !missing.has('weightKg'),
    // Tape measure counts as known only when it actually produced a body
    // composition. A waist without a neck, or a woman's measurement without a
    // hip, would otherwise be ticked off while changing nothing.
    tapeMeasure: goals.composition.ffmKg != null,
    twoWeeksLogged: steadyDays >= STEADY_LOG_DAYS,
  }

  const isMinor = goals.rails.includes('minor')
  const pendingMeasuresMessage = isMinor
    ? 'Şimdilik sana sayısal bir ölçü kurmuyorum. Sofrandaki denge yeter: her öğünde bir sebze, bir protein, bir tahıl 🌱'
    : 'Günün ölçüsünü kurabilmem için seni biraz daha tanımam gerek. Yukarıdaki adımlar doldukça burası da dolacak 🌱'

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader
          title="Hedeflerim"
          subtitle="Ölçülerin nereden geliyor"
          icon={<IconTarget size={26} color={violet} />}
        />

        <View className="gap-3">
          <DirectionPicker
            active={direction}
            isDefault={isDefault}
            pending={goalDirection.pending}
            startsOn={goalDirection.startsOn}
            onSelect={(next) => {
              void chooseDirection(next)
            }}
            busy={saving}
            error={saveError ?? (goalDirection.error ? LOAD_ERROR : null)}
          />

          <AcquaintanceMeter facts={facts} />

          {goals.hand ? (
            <HandMeasures measures={goals.hand} note={goals.confidenceNote} />
          ) : (
            <View className="rounded-2xl bg-surface p-4">
              <AppText weight="bold" className="text-xs tracking-wide text-faint">
                GÜNÜN ÖLÇÜSÜ
              </AppText>
              <View className="mt-3 flex-row items-center gap-2">
                <AfiPose pose="merak" size={64} />
                <AppText className="flex-1 text-sm leading-5 text-soft">
                  {pendingMeasuresMessage}
                </AppText>
              </View>
            </View>
          )}

          {goals.notes.length > 0 ? (
            <View className="gap-1.5 rounded-2xl bg-surface px-4 py-3">
              {goals.notes.map((note) => (
                <AppText key={note} className="text-xs leading-5 text-soft">
                  {note}
                </AppText>
              ))}
            </View>
          ) : null}

          <NumbersSection profile={profile} goals={goals} />
        </View>
      </ScrollView>
    </View>
  )
}
