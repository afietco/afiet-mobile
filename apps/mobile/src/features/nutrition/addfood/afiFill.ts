import type { FoodGroup, FoodMeasure, Macros } from '@afiet/core'
import { suggestFood } from '../afi'

/**
 * "Afi doldur": groups, measure and approximate values from a name.
 *
 * The add-food flow no longer calls this. Its details step used to open locked
 * behind a name-plus-description form against this second agent, and an unknown
 * food now goes to Afi in the photo-and-chat screen instead, which takes a
 * text-only turn against the assistant the app already has and writes its own
 * entry. What remains here is used by `CustomFoodSheet`, where somebody is
 * deliberately teaching the app a food rather than trying to log a meal.
 *
 * The park-and-consume handoff that used to live beside this is gone with its
 * last producer: the sentence reader parked foods here without nutrition
 * values, and a food with nothing to add up made every total it later appeared
 * in come out quietly short. When the reader learns to return values, the
 * handoff comes back with them.
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
