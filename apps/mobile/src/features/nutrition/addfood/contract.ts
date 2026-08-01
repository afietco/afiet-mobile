import type { FoodGroup, FoodMeasure, MealType } from '@afiet/core'
import type { Sofra } from '../sofra'
import type { ParsedFood } from './sentenceParse'
import type { AfiPoseName } from '@/ui/maskot'

/**
 * Shared contract for the stepped add-food flow.
 *
 * The flow replaced a single tall form with three deliberate steps: pick the
 * meal, name the food, then confirm what it is made of. Each step owns one
 * decision, Afi narrates it, and nothing is confirmed with a checkbox: moving
 * forward IS the confirmation. Only the back arrow returns.
 *
 * This module is the seam between the three step components and the flow host.
 * It holds no rendering and no data access so every step can be built and
 * tested against it independently.
 */

/** The three decisions, in order. `back` walks them in reverse. */
export type AddFoodStep = 'meal' | 'search' | 'details'

export const ADD_FOOD_STEPS: readonly AddFoodStep[] = ['meal', 'search', 'details']

/**
 * How the food's metadata was established.
 *
 * A food the user typed freehand is deliberately NOT saveable: unknown foods
 * must go through Afi (photo or bookmark) so that every logged meal carries
 * real group data and can move the balance. `null` means "not resolved yet".
 */
export type FoodOrigin =
  /** Matched a seed catalogue entry. */
  | 'catalog'
  /** Picked from the user's own saved menu. */
  | 'menu'
  /** Identified by Afi from a photo. */
  | 'photo'
  /** Described by the user and filled in by Afi (the bookmark path). */
  | 'bookmark'
  /** Read out of a sentence the user wrote about a whole meal. */
  | 'cumle'

/** The meal entry being assembled across the steps. */
export interface FoodDraft {
  name: string
  groups: FoodGroup[]
  measure: FoodMeasure
  quantity: number
  origin: FoodOrigin | null
}

export const EMPTY_DRAFT: FoodDraft = {
  name: '',
  groups: [],
  measure: 'porsiyon',
  quantity: 1,
  origin: null,
}

/**
 * A food the search step can offer: seed catalogue, saved menu, or a previous
 * entry. Carries enough metadata to resolve the draft in one tap.
 */
export interface FoodChoice {
  name: string
  groups: FoodGroup[]
  measure?: FoodMeasure
  origin: FoodOrigin
}

/**
 * Only a resolved draft may be written. Freehand text alone never qualifies:
 * an origin and at least one food group are both required.
 */
export function isDraftResolved(draft: FoodDraft): boolean {
  return draft.name.trim().length > 0 && draft.origin !== null && draft.groups.length > 0
}

/** Afi's stance for a step, so the host renders one mascot the steps drive. */
export interface AfiCue {
  pose: AfiPoseName
  /** The single line Afi says. Turkish, never scolding, no counting language. */
  line: string
}

/** Props every step component takes. The host owns the draft and the step. */
export interface StepProps {
  draft: FoodDraft
  /** Patch the draft; the host merges. */
  onDraft: (patch: Partial<FoodDraft>) => void
  /** Advance to the next step. The step decides when, there is no confirm button. */
  onAdvance: () => void
  /** Tell the host what Afi should be doing right now. */
  onCue: (cue: AfiCue) => void
}

export interface MealStepProps extends StepProps {
  meal: MealType | null
  onMeal: (meal: MealType) => void
}

export interface SearchStepProps extends StepProps {
  /** Repositories take a numeric profile id; keep it numeric across the seam. */
  profileId: number
  /**
   * The meal already chosen, so the step can offer something worth tapping
   * before anything is typed. Null only while the flow was opened without one.
   */
  meal: MealType | null
  /** Open the Afi photo route for an unknown food. */
  onNeedPhoto: () => void
  /**
   * Writes every food of a saved sofra into the chosen meal at once.
   *
   * The host owns it because it is a WRITE, and the search step writes
   * nothing: every other way out of this step resolves the draft and moves
   * forward, and a sofra is the one that skips the rest of the flow entirely.
   */
  onAddSofra: (sofra: Sofra) => void
  /** Open the Afi-assisted bookmark route for an unknown food. */
  onNeedBookmark: (name: string) => void
  /**
   * Hands over the foods read out of a whole sentence.
   *
   * The step does the reading because it owns the text and the waiting; the
   * host owns what happens next, which is a queue of confirmations.
   */
  onSentence: (foods: ParsedFood[]) => void
}

export interface DetailsStepProps extends StepProps {
  meal: MealType
  saving: boolean
  error: string | null
  /** `andAnother` keeps the sheet open on the same meal for the next food. */
  onSave: (andAnother?: boolean) => void
  /**
   * How many foods of a sentence are still waiting behind this one.
   *
   * Zero for every other route into this step, which is what keeps the queue
   * out of the ordinary single-food flow.
   */
  queued: number
  /** Drops the food on screen and moves on to the next queued one. */
  onSkip: () => void
}
