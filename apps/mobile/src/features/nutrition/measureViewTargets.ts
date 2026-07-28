import { goalRangeMid, type GoalRange, type GoalsResult } from '@afiet/core'

/**
 * The bridge between the goal engine and the numbers view of "Günün ölçüsü".
 *
 * Both views of the card read the same engine. Before this, the grams view
 * measured the day against `summary.targets`, which the backend still derives
 * the old way (TDEE times fixed percentages), while the hand measures came from
 * the engine, where protein scales off lean mass. Side by side under one toggle
 * that would have shown two different targets for the same person, which is
 * exactly the flaw docs/hedeflerim.md section 1 describes.
 *
 * What is eaten still comes from the record (`summary.nutrition`). Only the
 * target changes hands.
 *
 * Nothing here computes a target: `calculateGoals` owns every number and this
 * module only picks the ranges apart, rounds them for display and says, in one
 * value, why a target is missing when it is.
 */

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** Display rounding only. Coarse on purpose: a plus or minus fifteen percent
 *  estimate printed to the gram would read as an instruction. */
export const ENERGY_STEP_KCAL = 10
export const MACRO_STEP_G = 5

export interface MeasureTarget {
  /** The engine's range, untouched. */
  range: GoalRange
  /** Single value the progress bar is measured against. */
  mid: number
  /** Ready to read range, for example "120-140". Never a decimal. */
  text: string
}

export interface MeasureTargets {
  energy: MeasureTarget
  protein: MeasureTarget
  carb: MeasureTarget
  fat: MeasureTarget
}

/**
 * Why the card can or cannot speak in numbers today.
 *
 * `unchosen` is not a failure: the engine mutes numeric targets until a
 * direction is picked (doc sections 3 and 8), so that user still gets full hand
 * measures and only the grams stay quiet.
 */
export type MeasureTargetsState =
  | { kind: 'ready'; targets: MeasureTargets }
  /** The engine has not answered yet. */
  | { kind: 'loading' }
  /** Under 18: balance language only, never a target (doc section 9). */
  | { kind: 'minor' }
  /** Missing inputs; the engine withheld the target rather than guessing. */
  | { kind: 'incomplete' }
  /** No direction chosen yet, so numeric targets stay muted. */
  | { kind: 'unchosen' }

/** Both ends land on the same step for a narrow range, so it prints once. */
export function formatTargetRange(range: GoalRange, step: number): string {
  const min = Math.round(range.min / step) * step
  const max = Math.round(range.max / step) * step
  return min === max ? num0.format(min) : `${num0.format(min)}-${num0.format(max)}`
}

function measureTarget(range: GoalRange, step: number): MeasureTarget {
  return { range, mid: goalRangeMid(range), text: formatTargetRange(range, step) }
}

/**
 * Order matters. A minor is also withheld and also muted, and a withheld result
 * is also muted, so the most specific reason has to be read first or the card
 * would explain itself with the wrong sentence.
 */
export function measureTargetsState(goals: GoalsResult | null): MeasureTargetsState {
  if (!goals) return { kind: 'loading' }
  if (goals.rails.includes('minor')) return { kind: 'minor' }
  if (goals.targetsWithheld || !goals.target || !goals.macros) return { kind: 'incomplete' }
  if (goals.numericTargetsMuted) return { kind: 'unchosen' }

  return {
    kind: 'ready',
    targets: {
      energy: measureTarget(goals.target.range, ENERGY_STEP_KCAL),
      protein: measureTarget(goals.macros.protein, MACRO_STEP_G),
      carb: measureTarget(goals.macros.carb, MACRO_STEP_G),
      fat: measureTarget(goals.macros.fat, MACRO_STEP_G),
    },
  }
}
