import type { MealType } from '@afiet/core'
import {
  ADD_FOOD_STEPS,
  EMPTY_DRAFT,
  isDraftResolved,
  type AddFoodStep,
  type FoodDraft,
  type FoodOrigin,
} from './contract'

/**
 * The add-food wizard's state machine.
 *
 * Deliberately free of React, of native modules and of data access: the whole
 * "which step am I on and may I move" question is decidable from plain values,
 * so it can be read, reasoned about and tested without a device. The hook
 * (`useAddFoodFlow`) only wires this to React state, saving and telemetry.
 *
 * The one rule the machine exists to enforce: nothing in this wizard is
 * confirmed with a button. Making the step's decision IS the confirmation, and
 * a step may only be left once its own decision is actually made.
 */

/** Which way the last transition moved, so the host can animate it. */
export type StepDirection = 'forward' | 'back'

export interface AddFoodFlowState {
  step: AddFoodStep
  /** The step the flow opened on. Back never walks behind it. */
  entryStep: AddFoodStep
  meal: MealType | null
  draft: FoodDraft
  direction: StepDirection
}

export type AddFoodAction =
  /** Opens (or reopens) the flow, optionally with the meal already decided. */
  | { type: 'reset'; meal: MealType | null }
  | { type: 'meal'; meal: MealType }
  | { type: 'draft'; patch: Partial<FoodDraft> }
  | { type: 'advance' }
  | { type: 'back' }
  /** Keeps the meal, clears the food, and goes back to the search step. */
  | { type: 'nextFood' }
  /** Branches off search into the sofra step; the host holds the sofra itself. */
  | { type: 'sofra' }

/** A preselected meal skips the first decision and opens on the search step. */
export function createFlowState(meal: MealType | null): AddFoodFlowState {
  const step: AddFoodStep = meal === null ? 'meal' : 'search'
  return { step, entryStep: step, meal, draft: { ...EMPTY_DRAFT }, direction: 'forward' }
}

function stepIndex(step: AddFoodStep): number {
  return ADD_FOOD_STEPS.indexOf(step)
}

/** A step may be left only once its own decision is made. */
export function canAdvance(state: AddFoodFlowState): boolean {
  switch (state.step) {
    case 'meal':
      return state.meal !== null
    case 'search':
      // Food groups are the details step's job. What the search step has to
      // establish is that the food came from somewhere real, so freehand text
      // on its own can never walk forward.
      return state.draft.origin !== null && state.draft.name.trim().length > 0
    case 'details':
    case 'sofra':
      // Both are ends of the line: what follows them is a write, not a step.
      return false
  }
}

/** True once the flow has walked past the step it opened on. */
export function canGoBack(state: AddFoodFlowState): boolean {
  // The branch is only ever reached from search, so it can always go back.
  if (state.step === 'sofra') return true
  return stepIndex(state.step) > stepIndex(state.entryStep)
}

/**
 * The save gate. A meal must be chosen and the draft must be resolved, which
 * per the contract means a typed name alone never qualifies: an origin and at
 * least one food group are both required so every saved meal can move the
 * balance.
 */
export function canSaveDraft(state: AddFoodFlowState): boolean {
  return state.meal !== null && isDraftResolved(state.draft)
}

/**
 * Telemetry keeps the two values the rest of the app already emits ("seed" for
 * the shipped catalogue, "custom" for everything the user or Afi established)
 * so meal_logged stays comparable across entry points.
 */
const TELEMETRY_SOURCE: Record<FoodOrigin, string> = {
  catalog: 'seed',
  menu: 'custom',
  photo: 'custom',
  cumle: 'custom',
}

export function telemetrySource(origin: FoodOrigin | null): string {
  return origin === null ? 'custom' : TELEMETRY_SOURCE[origin]
}

function advanced(state: AddFoodFlowState): AddFoodFlowState {
  if (!canAdvance(state)) return state
  return { ...state, step: ADD_FOOD_STEPS[stepIndex(state.step) + 1], direction: 'forward' }
}

export function addFoodReducer(
  state: AddFoodFlowState,
  action: AddFoodAction,
): AddFoodFlowState {
  switch (action.type) {
    case 'reset':
      return createFlowState(action.meal)
    case 'meal': {
      const chosen = { ...state, meal: action.meal }
      // Choosing IS confirming: the pick itself carries the flow forward.
      return state.step === 'meal' ? advanced(chosen) : chosen
    }
    case 'draft':
      return { ...state, draft: { ...state.draft, ...action.patch } }
    case 'advance':
      return advanced(state)
    case 'sofra':
      return state.step === 'search' ? { ...state, step: 'sofra', direction: 'forward' } : state
    case 'back':
      if (state.step === 'sofra') return { ...state, step: 'search', direction: 'back' }
      return canGoBack(state)
        ? { ...state, step: ADD_FOOD_STEPS[stepIndex(state.step) - 1], direction: 'back' }
        : state
    case 'nextFood':
      /* One meal is usually several foods. The meal is already decided, so the
         next one starts at the search step with an empty draft rather than
         making the person reopen the sheet and pick the meal again. */
      return { ...state, step: 'search', draft: { ...EMPTY_DRAFT }, direction: 'forward' }
  }
}
