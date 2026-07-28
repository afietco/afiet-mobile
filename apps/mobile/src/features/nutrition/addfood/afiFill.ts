import type { CustomFood, FoodGroup, FoodMeasure, Macros } from '@afiet/core'
import { suggestFood } from '../afi'

/**
 * "Afi doldur" for the add-food details step.
 *
 * The unknown-food (bookmark) path collects a name AND a short description
 * before Afi may run: the description is what turns "börek" into something a
 * suggestion can actually be built on, and it is also the note the food keeps
 * once it lands in the user's menu.
 *
 * Backend reality, so nobody has to guess later: the only endpoint that maps
 * text to food groups is POST /v1/afi/food-suggest and its payload is
 * `{ name }` alone. The server validates 2..80 characters and forwards that
 * single string to the Foundry agent as the user message; there is no field
 * for a separate description yet. Until the endpoint grows one, the
 * description rides inside the same string in parentheses whenever it fits.
 * `composeFillPrompt` is the entirety of that compromise and the only place
 * that changes when the backend catches up. Nothing here invents nutrition
 * data: every value in the result comes from the service.
 */

/** The server rejects a `name` outside 2..80 characters. */
export const AFI_FILL_PROMPT_MAX_LENGTH = 80
export const AFI_FILL_NAME_MIN_LENGTH = 2
/** Enough to be a real hint ("ev yapımı") rather than a stray keystroke. */
export const AFI_FILL_DESCRIPTION_MIN_LENGTH = 3

export interface AfiFillInput {
  name: string
  /** The "besin bilgisi" the user typed under the name. */
  description: string
}

export interface AfiFillResult {
  groups: FoodGroup[]
  measure: FoodMeasure
  /** Approximate values for one measure, straight from the service. */
  macros: Macros
  /** The service's own wording, kept only as a fallback note. */
  description?: string
}

const runeCount = (value: string) => Array.from(value).length

const collapse = (value: string) => value.replace(/\s+/g, ' ').trim()

/** Both fields must carry something before the fill action may run. */
export function isAfiFillReady(input: AfiFillInput): boolean {
  return (
    runeCount(collapse(input.name)) >= AFI_FILL_NAME_MIN_LENGTH &&
    runeCount(collapse(input.description)) >= AFI_FILL_DESCRIPTION_MIN_LENGTH
  )
}

function trimToRunes(value: string, max: number): string {
  const runes = Array.from(value)
  return runes.length <= max ? value : runes.slice(0, max).join('')
}

/** Longest whole-word prefix of `value` fitting in `budget` runes. */
function fitWords(value: string, budget: number): string {
  if (budget <= 0) return ''
  if (runeCount(value) <= budget) return value
  let fitted = ''
  for (const word of value.split(' ')) {
    const next = fitted ? `${fitted} ${word}` : word
    if (runeCount(next) > budget) break
    fitted = next
  }
  return fitted
}

/**
 * The single string the suggestion endpoint accepts. The description is
 * appended in parentheses when it fits; a description that cannot fit is
 * dropped rather than cut mid-word, and the name alone still asks a valid
 * question.
 */
export function composeFillPrompt(name: string, description: string): string {
  const cleanName = trimToRunes(collapse(name), AFI_FILL_PROMPT_MAX_LENGTH)
  const cleanDescription = collapse(description)
  if (!cleanDescription) return cleanName
  // " ()" costs three runes on top of the description itself.
  const budget = AFI_FILL_PROMPT_MAX_LENGTH - runeCount(cleanName) - 3
  const fitted = fitWords(cleanDescription, budget)
  return fitted ? `${cleanName} (${fitted})` : cleanName
}

/** Asks Afi for the groups, measure and approximate values of one food. */
export async function requestAfiFill(input: AfiFillInput): Promise<AfiFillResult> {
  const suggestion = await suggestFood(composeFillPrompt(input.name, input.description))
  return {
    groups: suggestion.groups,
    measure: suggestion.measure,
    macros: suggestion.macros,
    description: suggestion.description,
  }
}

/**
 * Handoff for the food the user just taught the app.
 *
 * The step itself writes nothing: the flow host owns every save. But the
 * draft in `contract.ts` has no room for a description or approximate values,
 * so the filled record would otherwise be lost the moment the meal entry is
 * written. The step parks it here when the fill lands and the host consumes
 * it next to its own save:
 *
 *   const learned = takeFilledMenuFood()
 *   if (learned) await foodRepo.saveCustom(learned)
 *
 * `saveCustom` already treats a duplicate name as success, so consuming this
 * twice is harmless.
 */
let filledMenuFood: CustomFood | null = null

export function rememberFilledMenuFood(food: CustomFood): void {
  filledMenuFood = { ...food }
}

/** Reads and clears the pending record; null when there is nothing to learn. */
export function takeFilledMenuFood(): CustomFood | null {
  const food = filledMenuFood
  filledMenuFood = null
  return food
}

/** Drops the pending record when the flow is abandoned. */
export function forgetFilledMenuFood(): void {
  filledMenuFood = null
}
