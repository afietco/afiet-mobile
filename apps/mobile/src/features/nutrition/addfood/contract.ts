import type { FoodGroup, FoodMeasure, MealType } from '@afiet/core'
import type { Sofra, SofraFood } from '../sofra'
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

/**
 * The three decisions, in order, plus one branch.
 *
 * `sofra` is not a fourth decision: it hangs off the search step for the one
 * choice that is a whole meal rather than a food, and it returns to search
 * rather than continuing to details. `ADD_FOOD_STEPS` stays the linear spine
 * that `advance` and `back` walk by index; the branch is handled by name.
 */
export type AddFoodStep = 'meal' | 'search' | 'details' | 'sofra'

export const ADD_FOOD_STEPS: readonly AddFoodStep[] = ['meal', 'search', 'details']

/**
 * How the food's metadata was established.
 *
 * A food the user typed freehand is deliberately NOT saveable: an unknown food
 * goes to Afi in the photo-and-chat screen, which writes its own entry, so that
 * every logged meal carries real group data and can move the balance. `null`
 * means "not resolved yet".
 */
export type FoodOrigin =
  /** Matched a seed catalogue entry. */
  | 'catalog'
  /** Picked from the user's own saved menu. */
  | 'menu'
  /** Identified by Afi from a photo. */
  | 'photo'
  /** Read out of a sentence the user wrote about a whole meal. */
  | 'cumle'

/** The meal entry being assembled across the steps. */
export interface FoodDraft {
  name: string
  groups: FoodGroup[]
  measure: FoodMeasure
  quantity: number
  origin: FoodOrigin | null
  /**
   * What one measure of this food weighs, when the catalogue knows.
   *
   * Carried on the draft rather than looked up again in the details step: it
   * decides which measures may be offered at all (`allowedMeasures`), and only
   * the row that resolved the food knows whether the number belongs to it. A
   * menu food has none, so its measure stays fixed.
   */
  gramPerMeasure?: number
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
  /** Catalogue foods carry the gram weight of one measure; menu foods do not. */
  gramPerMeasure?: number
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
  /**
   * Leaves the flow for the Menüm screen, where sofras are built.
   *
   * The step below the meal cards is the first place many people ever hear that
   * sofras exist, and hearing about them is worthless without a way to get
   * there. The host owns it because leaving means closing the sheet.
   */
  onExitToMenu: () => void
}

export interface SearchStepProps extends StepProps {
  /** Repositories take a numeric profile id; keep it numeric across the seam. */
  profileId: number
  /** The day the entry will be written to; the personal list reads back from it. */
  date: string
  /**
   * The meal already chosen, so the step can offer something worth tapping
   * before anything is typed. Null only while the flow was opened without one.
   */
  meal: MealType | null
  /** Open the Afi photo route for an unknown food. */
  onNeedPhoto: () => void
  /**
   * Opens the sofra step with this sofra loaded.
   *
   * A sofra used to be written straight from this row, which meant the whole
   * meal landed at its saved amounts with no chance to say "half of that
   * today". It now leads to its own step, and the write happens there.
   */
  onPickSofra: (sofra: Sofra) => void
  /** Hand an unknown food to Afi, who takes it in the photo-and-chat screen. */
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

/**
 * The sofra step: a saved meal, laid out so it can be adjusted before it lands.
 *
 * The amounts live here rather than in the flow state because they exist only
 * for the length of this screen: a sofra keeps its own saved amounts, and what
 * this step collects is "how much of it, today".
 */
export interface SofraStepProps {
  sofra: Sofra
  meal: MealType
  saving: boolean
  error: string | null
  /** Writes the listed foods into the meal, in the amounts shown. */
  onAdd: (foods: SofraFood[]) => void
  onCue: (cue: AfiCue) => void
}
