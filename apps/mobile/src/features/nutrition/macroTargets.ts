import { goalRangeMid, type GoalRange, type GoalsResult } from '@afiet/core'

/**
 * The bridge between the goal engine and the macro card on Beslenme.
 *
 * What was eaten still comes from the record (`summary.nutrition`). Only the
 * target changes hands. It used to come from `summary.targets`, which the
 * backend still derives the old way (an estimated TDEE times fixed
 * percentages), while protein actually scales off lean mass and carbohydrate is
 * the balance rather than a goal of its own (docs/hedeflerim.md sections 1 and
 * 4.5). The engine is the one that knows.
 *
 * Nothing here computes a target: `calculateGoals` owns every number and this
 * module only picks the ranges apart, rounds them for display, and says in one
 * value why a target is missing on the rare day it is.
 */

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

/** Display rounding only. Coarse on purpose: a plus or minus fifteen percent
 *  estimate printed to the gram would read as an instruction. */
export const ENERGY_STEP_KCAL = 10
export const MACRO_STEP_G = 5

export interface MacroTarget {
  /** The engine's range, untouched. */
  range: GoalRange
  /** Single value the progress bar is measured against. */
  mid: number
  /** Ready to read range, for example "120-140". Never a decimal. */
  text: string
}

export interface MacroTargets {
  energy: MacroTarget
  protein: MacroTarget
  carb: MacroTarget
  fat: MacroTarget
}

/**
 * Whether the card has a target to measure today against, and if not, why.
 *
 * An unchosen direction is deliberately absent from this list. The engine falls
 * back to a silent `duzen`, which produces balanced targets, and those are a
 * truthful answer: withholding them would leave the card empty for everyone who
 * skipped one onboarding question. The confidence line already says how firm
 * the numbers are.
 */
export type MacroTargetsState =
  | { kind: 'ready'; targets: MacroTargets }
  /** The engine has not answered yet. */
  | { kind: 'loading' }
  /** Under 18: balance language only, never a target (doc section 9). */
  | { kind: 'minor' }
  /** Missing inputs; the engine withheld the target rather than guessing. */
  | { kind: 'incomplete' }

/** Both ends land on the same step for a narrow range, so it prints once. */
export function formatTargetRange(range: GoalRange, step: number): string {
  const min = Math.round(range.min / step) * step
  const max = Math.round(range.max / step) * step
  return min === max ? num0.format(min) : `${num0.format(min)}-${num0.format(max)}`
}

function macroTarget(range: GoalRange, step: number): MacroTarget {
  return { range, mid: goalRangeMid(range), text: formatTargetRange(range, step) }
}

/**
 * Order matters. A minor is also withheld, so the most specific reason has to be
 * read first or the card would explain itself with the wrong sentence.
 */
export function macroTargetsState(goals: GoalsResult | null): MacroTargetsState {
  if (!goals) return { kind: 'loading' }
  if (goals.rails.includes('minor')) return { kind: 'minor' }
  if (goals.targetsWithheld || !goals.target || !goals.macros) return { kind: 'incomplete' }

  return {
    kind: 'ready',
    targets: {
      energy: macroTarget(goals.target.range, ENERGY_STEP_KCAL),
      protein: macroTarget(goals.macros.protein, MACRO_STEP_G),
      carb: macroTarget(goals.macros.carb, MACRO_STEP_G),
      fat: macroTarget(goals.macros.fat, MACRO_STEP_G),
    },
  }
}
