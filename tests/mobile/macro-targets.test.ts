import {
  bmr,
  calculateGoals,
  macroTargetGrams,
  tdee,
  type ActivityLevel,
  type GoalDirection,
  type GoalsInput,
  type Sex,
} from '@afiet/core'
import { describe, expect, it } from 'vitest'
import {
  ENERGY_STEP_KCAL,
  MACRO_STEP_G,
  formatTargetRange,
  macroTargetsState,
} from '../../apps/mobile/src/features/nutrition/macroTargets'

/**
 * What the macro card on Beslenme measures the day against.
 *
 * The target comes from the goal engine rather than from `summary.targets`,
 * which the backend still derives the old way (docs/hedeflerim.md section 1).
 * These tests pin that down, plus the two honest reasons a target may be
 * missing, and the far more important promise that it usually is not: a person
 * the engine can compute for gets numbers, whether or not they ever answered
 * the direction question.
 */

interface Person {
  sex: Sex
  ageYears: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  waistCm?: number
  neckCm?: number
  hipCm?: number
}

/** A man who has given his tape measure, so protein scales off lean mass. */
const MEASURED: Person = {
  sex: 'erkek',
  ageYears: 34,
  heightCm: 182,
  weightKg: 92,
  activityLevel: 'aktif',
  waistCm: 94,
  neckCm: 39,
}

/** The same body without the tape measure: protein falls back to weight. */
const UNMEASURED: Person = {
  sex: 'erkek',
  ageYears: 34,
  heightCm: 182,
  weightKg: 92,
  activityLevel: 'aktif',
}

const WOMAN: Person = {
  sex: 'kadin',
  ageYears: 29,
  heightCm: 165,
  weightKg: 62,
  activityLevel: 'orta',
  waistCm: 74,
  neckCm: 32,
  hipCm: 96,
}

const MINOR: Person = {
  sex: 'erkek',
  ageYears: 16,
  heightCm: 170,
  weightKg: 58,
  activityLevel: 'orta',
}

function goalsFor(person: Person, direction?: GoalDirection) {
  const input: GoalsInput = {
    sex: person.sex,
    ageYears: person.ageYears,
    heightCm: person.heightCm,
    weightKg: person.weightKg,
    activityLevel: person.activityLevel,
    measurements: person.waistCm
      ? { waistCm: person.waistCm, neckCm: person.neckCm, hipCm: person.hipCm }
      : undefined,
    direction,
  }
  return calculateGoals(input)
}

/** What the backend summary still puts in `targets`: TDEE times a percentage. */
function legacyProteinTarget(person: Person): number {
  const basal = bmr(person.sex, person.weightKg, person.heightCm, person.ageYears)
  return macroTargetGrams(tdee(basal, person.activityLevel), 'protein')
}

describe('macro targets', () => {
  it('hands over the engine ranges untouched, computing nothing of its own', () => {
    const goals = goalsFor(MEASURED, 'hafifle')
    const state = macroTargetsState(goals)
    expect(state.kind).toBe('ready')
    if (state.kind !== 'ready') return

    expect(state.targets.energy.range).toBe(goals.target?.range)
    expect(state.targets.protein.range).toBe(goals.macros?.protein)
    expect(state.targets.carb.range).toBe(goals.macros?.carb)
    expect(state.targets.fat.range).toBe(goals.macros?.fat)
  })

  it('measures the bars against the middle of the engine range, not an end', () => {
    const goals = goalsFor(MEASURED, 'hafifle')
    const state = macroTargetsState(goals)
    if (state.kind !== 'ready') throw new Error('expected a target')

    for (const key of ['energy', 'protein', 'carb', 'fat'] as const) {
      const { range, mid } = state.targets[key]
      expect(mid).toBeGreaterThanOrEqual(range.min)
      expect(mid).toBeLessThanOrEqual(range.max)
      expect(mid).toBeCloseTo((range.min + range.max) / 2, 6)
    }
  })

  it('scales protein off lean mass, which lands below the old percentage target', () => {
    const state = macroTargetsState(goalsFor(MEASURED, 'hafifle'))
    if (state.kind !== 'ready') throw new Error('expected a target')

    // The visible target is meant to change: 204 g of protein came from a
    // quarter of an estimated TDEE, the new one from 1.8 to 2.2 g per kg of fat
    // free mass. Anyone reading both at once would have seen two truths.
    expect(Math.round(legacyProteinTarget(MEASURED))).toBe(204)
    expect(Math.round(state.targets.protein.range.min)).toBe(130)
    expect(Math.round(state.targets.protein.range.max)).toBe(159)
    expect(state.targets.protein.range.max).toBeLessThan(legacyProteinTarget(MEASURED))
    expect(state.targets.protein.text).toBe('130-160')
  })

  it('falls back to body weight when no tape measure was given', () => {
    const measured = macroTargetsState(goalsFor(MEASURED, 'hafifle'))
    const unmeasured = macroTargetsState(goalsFor(UNMEASURED, 'hafifle'))
    if (measured.kind !== 'ready' || unmeasured.kind !== 'ready') {
      throw new Error('expected a target')
    }

    // Both are honest, and both stay under the old figure.
    expect(unmeasured.targets.protein.range.max).toBeLessThan(legacyProteinTarget(UNMEASURED))
    expect(unmeasured.targets.protein.text).not.toBe(measured.targets.protein.text)
  })

  it('prints ranges, never decimals', () => {
    for (const person of [MEASURED, UNMEASURED, WOMAN]) {
      const state = macroTargetsState(goalsFor(person, 'koru'))
      if (state.kind !== 'ready') throw new Error('expected a target')
      for (const key of ['energy', 'protein', 'carb', 'fat'] as const) {
        // A comma is the Turkish decimal separator; the dot is the thousands
        // separator and is fine in "2.830-3.090".
        expect(state.targets[key].text).not.toContain(',')
        expect(state.targets[key].text).toMatch(/^[\d.]+(-[\d.]+)?$/)
      }
    }
  })

  it('collapses a range whose ends round to the same step', () => {
    expect(formatTargetRange({ min: 118, max: 121 }, MACRO_STEP_G)).toBe('120')
    expect(formatTargetRange({ min: 118, max: 133 }, MACRO_STEP_G)).toBe('120-135')
    expect(formatTargetRange({ min: 1846, max: 1852 }, ENERGY_STEP_KCAL)).toBe('1.850')
  })

  it('gives numbers to someone the engine barely knows', () => {
    /* The complaint that brought the macro card back: the card read "referans
       hazırlanıyor" for anyone who had not chosen a direction, which is most
       people. Sex, age, height and weight are enough, and a skipped direction
       falls back to the balanced default rather than to silence. */
    const barelyKnown = calculateGoals({
      sex: 'erkek',
      ageYears: 35,
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'orta',
    })
    expect(barelyKnown.directionUnchosen).toBe(true)

    const state = macroTargetsState(barelyKnown)
    expect(state.kind).toBe('ready')
    if (state.kind !== 'ready') return
    expect(state.targets.energy.text).toBe('2.630-2.900')
    expect(state.targets.protein.text).toBe('95-130')
    expect(state.targets.carb.text).toBe('365-445')
    expect(state.targets.fat.text).toBe('75-80')

    // Even without an activity level, which only widens the maintenance band.
    const noActivity = calculateGoals({
      sex: 'kadin',
      ageYears: 30,
      heightCm: 165,
      weightKg: 62,
    })
    expect(macroTargetsState(noActivity).kind).toBe('ready')
  })

  it('never leaves a target unspoken while the hand measures would have one', () => {
    const people = [MEASURED, UNMEASURED, WOMAN, MINOR]
    const directions: (GoalDirection | undefined)[] = [
      'hafifle',
      'donusum',
      'koru',
      'duzen',
      undefined,
    ]

    for (const person of people) {
      for (const direction of directions) {
        const goals = goalsFor(person, direction)
        const state = macroTargetsState(goals)
        /* The engine speaks with one voice: it either has a day's measure or it
           does not, and the card follows it rather than muting half of it. */
        expect(state.kind === 'ready').toBe(goals.hand !== null)
      }
    }
  })

  it('says why there is no target instead of inventing one', () => {
    // Under 18 the engine withholds the target entirely (doc section 9).
    expect(macroTargetsState(goalsFor(MINOR, 'hafifle')).kind).toBe('minor')
    expect(macroTargetsState(goalsFor(MINOR)).kind).toBe('minor')

    // Missing inputs: nothing to compute from, and nothing invented.
    const incomplete = calculateGoals({ sex: 'erkek', heightCm: 182, direction: 'koru' })
    expect(macroTargetsState(incomplete).kind).toBe('incomplete')

    // Nothing at all yet.
    expect(macroTargetsState(null).kind).toBe('loading')
  })
})
