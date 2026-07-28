import {
  addDays,
  calculateGoals,
  todayISO,
  type GoalDirection,
  type GoalsResult,
  type Measurement,
  type Profile,
} from '@afiet/core'
import { useMemo } from 'react'
import { mealRepo, measurementRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useGoalDirection } from './useGoalDirection'

/**
 * The one place the goal engine is called from.
 *
 * The measures used to live on a single screen, so the wiring lived there too.
 * They are now spread across Beslenme (the hand measures) and Vücudum (the
 * acquaintance meter and the numbers), and two screens computing their own
 * targets would drift the moment either one forgot an input. Both read this.
 *
 * Everything numeric still comes from `calculateGoals`; this hook only gathers
 * what the engine needs and memoizes the call, because the screens re-render on
 * every meal and measurement notification.
 */

/** How far back "steady logging" looks, and how many days inside it count. */
const STEADY_WINDOW_DAYS = 14
const STEADY_LOG_DAYS = 10

/**
 * The most recent measurement that actually carries the girths the body fat
 * estimate needs. A newer weight-only entry must not hide an older complete
 * one, or the composition would vanish the next time someone weighs in.
 */
function latestWithGirths(measurements: readonly Measurement[]): Measurement | undefined {
  for (let i = measurements.length - 1; i >= 0; i -= 1) {
    const measurement = measurements[i]
    if (measurement?.waistCm != null && measurement.neckCm != null) return measurement
  }
  return undefined
}

/**
 * What the acquaintance meter needs to know, derived once alongside the goals.
 *
 * Declared here, where it is produced, and imported by the component that draws
 * it. Two structurally identical copies would compile happily and then drift
 * the first time one of them learned a new field.
 */
export interface AcquaintanceFacts {
  /** Sex, birth date, height and daily movement level are all on the profile. */
  basics: boolean
  /** At least one weight entry exists. */
  firstWeight: boolean
  /** A measurement carries the girths the body fat estimate needs. */
  tapeMeasure: boolean
  /** Two weeks of steady logging are behind the person. */
  twoWeeksLogged: boolean
}

export interface GoalsState {
  goals: GoalsResult | null
  facts: AcquaintanceFacts | null
  /**
   * The resolved profile and measurements, passed through.
   *
   * The hook already subscribes to both tables to feed the engine. A host that
   * also needs them (Vücudum draws the weight history, and the numbers panel
   * takes the profile) would otherwise open a second live subscription to the
   * same table and run the query twice on every notify, because `useLive` does
   * not dedupe across instances.
   */
  profile: Profile | null
  measurements: readonly Measurement[] | undefined
  /** The newest measurement, which is what most callers actually want. */
  latest: Measurement | undefined
  /** The active direction and whether it is still the silent default. */
  direction: GoalDirection
  directionIsDefault: boolean
  /** True until every query the engine depends on has answered. */
  loading: boolean
  error: Error | null
  retry: () => void
}

export interface UseGoalsOptions {
  today?: string
  /**
   * Derive the acquaintance facts too. Off by default because they cost an
   * extra `['meals']` subscription that re-runs on every meal notification,
   * and Beslenme, the hottest screen in the app, never reads them.
   */
  withFacts?: boolean
}

export function useGoals({ today = todayISO(), withFacts = false }: UseGoalsOptions = {}): GoalsState {
  const { id: profileId, profile, error: profileError, retry: retryProfile } = useActiveProfile()

  const measurementsQuery = useLive(
    ['measurements'],
    () => (profileId ? measurementRepo.forProfile(profileId) : Promise.resolve([])),
    [profileId],
  )
  /* Subscribing to no table means no notification ever re-runs this, so a host
     that does not want facts pays nothing for them. The hook call itself stays
     unconditional, as the rules of hooks require. */
  const loggedDatesQuery = useLive(
    withFacts ? ['meals'] : [],
    () => (withFacts && profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId, withFacts],
  )
  const { direction, isDefault, loading: directionLoading } = useGoalDirection(today)

  const measurements = measurementsQuery.data
  const latest = measurements?.at(-1)
  const girths = measurements ? latestWithGirths(measurements) : undefined

  const goals = useMemo(() => {
    if (!profile || measurements === undefined) return null
    return calculateGoals({
      sex: profile.sex,
      birthDate: profile.birthDate,
      heightCm: profile.heightCm,
      weightKg: latest?.weightKg,
      activityLevel: profile.activityLevel,
      measurements: girths
        ? { waistCm: girths.waistCm, neckCm: girths.neckCm, hipCm: girths.hipCm }
        : undefined,
      // An unchosen direction is passed as absent rather than as `duzen`, so
      // the engine knows to keep the numeric target muted.
      direction: isDefault ? undefined : direction,
    })
  }, [
    profile,
    measurements,
    latest?.weightKg,
    girths,
    direction,
    isDefault,
  ])

  const loggedDates = loggedDatesQuery.data
  const facts = useMemo(() => {
    if (!withFacts || !goals || loggedDates === undefined) return null
    const windowStart = addDays(today, -(STEADY_WINDOW_DAYS - 1))
    const steadyDays = new Set(
      loggedDates.filter((date) => date >= windowStart && date <= today),
    ).size
    const missing = new Set(goals.missingInputs)
    return {
      basics:
        !missing.has('sex') &&
        !missing.has('age') &&
        !missing.has('heightCm') &&
        !missing.has('activityLevel'),
      firstWeight: !missing.has('weightKg'),
      /* Tape measure counts only when it actually produced a composition. A
         waist without a neck, or a woman's measurement without a hip, would
         otherwise be ticked off while changing nothing. */
      tapeMeasure: goals.composition.ffmKg != null,
      twoWeeksLogged: steadyDays >= STEADY_LOG_DAYS,
    }
  }, [withFacts, goals, loggedDates, today])

  return {
    goals,
    facts,
    profile: profile ?? null,
    measurements,
    latest,
    direction,
    directionIsDefault: isDefault,
    loading:
      !profileId ||
      !profile ||
      measurements === undefined ||
      loggedDates === undefined ||
      directionLoading,
    error: profileError ?? measurementsQuery.error ?? loggedDatesQuery.error,
    retry: () => {
      retryProfile()
      measurementsQuery.retry()
      loggedDatesQuery.retry()
    },
  }
}
