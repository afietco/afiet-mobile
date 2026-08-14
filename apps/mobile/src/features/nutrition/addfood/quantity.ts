import type { FoodMeasure } from '@afiet/core'

/**
 * How much of a food, and how that survives a change of measure.
 *
 * Servings and grams are counted in different sizes: half a portion is a real
 * amount, half a gram is noise, and twelve grams of anything is not a meal. The
 * stepper therefore reads its bounds from the measure rather than carrying one
 * set for everything.
 *
 * Switching measure converts the amount instead of resetting it. Someone who
 * says "one portion" and then asks for grams means that same portion in grams,
 * not one gram, and a stepper that started at 1 g would make them press the
 * button twenty times to get back to where they already were.
 */

export interface QuantityRange {
  min: number
  max: number
  step: number
}

const SERVING_RANGE: QuantityRange = { min: 0.5, max: 12, step: 0.5 }
const GRAM_RANGE: QuantityRange = { min: 5, max: 1000, step: 10 }

export function quantityRange(measure: FoodMeasure): QuantityRange {
  return measure === 'gram' ? GRAM_RANGE : SERVING_RANGE
}

const clamp = (value: number, { min, max }: QuantityRange) =>
  Math.min(max, Math.max(min, value))

/** Rounds to one decimal so 0.5 steps never drift into 1.4999999999. */
const round1 = (value: number) => Math.round(value * 10) / 10

export function nudgeQuantity(
  quantity: number,
  measure: FoodMeasure,
  direction: 1 | -1,
): number {
  const range = quantityRange(measure)
  return clamp(round1(quantity + direction * range.step), range)
}

/**
 * The same amount of food, said in another measure.
 *
 * Grams are the only conversion the catalogue can actually do (see
 * `measureServings` in @afiet/core), so a missing gram weight leaves the number
 * alone rather than guessing at it.
 */
export function convertQuantity(
  quantity: number,
  from: FoodMeasure,
  to: FoodMeasure,
  gramPerMeasure?: number,
): number {
  if (from === to) return quantity
  if (gramPerMeasure === undefined || gramPerMeasure <= 0) {
    return clamp(quantity, quantityRange(to))
  }
  if (to === 'gram') return clamp(Math.round(quantity * gramPerMeasure), GRAM_RANGE)
  if (from === 'gram') return clamp(round1(quantity / gramPerMeasure), SERVING_RANGE)
  return clamp(quantity, quantityRange(to))
}
