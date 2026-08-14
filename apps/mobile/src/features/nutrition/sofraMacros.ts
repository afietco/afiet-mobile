import type { CustomFood, FoodGroup } from '@afiet/core'
import { sumMacros, type DayMacros } from '@afiet/core/macros'
import type { SofraFood } from './sofra'

/**
 * What a saved table adds up to.
 *
 * A sofra is a set of foods with amounts, which is the same shape a logged day
 * has, so the arithmetic is the same one (`sumMacros` in @afiet/core) rather
 * than a second implementation that would drift. Measures are read properly:
 * a sofra holding "2 dilim" of something counts two slices, not two of
 * whatever the food's own measure happens to be.
 *
 * `unknownCount` is the honest half of the answer. A food nobody has taught
 * the app values for cannot be added up, and saying the total without saying
 * that would make a sofra look smaller than it is. Every door into the menu
 * now carries values with it, so this should stay zero for anything saved from
 * here on; the ones already saved without them are why it is still reported.
 */
export interface SofraTotals extends DayMacros {
  /** Every food group the table covers, in the order the groups are declared. */
  groups: FoodGroup[]
}

export function sofraTotals(
  foods: readonly SofraFood[],
  customFoods?: CustomFood[],
): SofraTotals {
  const totals = sumMacros(
    foods.map((food) => ({
      foodName: food.name,
      measure: food.measure ?? undefined,
      quantity: food.quantity,
    })),
    customFoods,
  )
  const seen = new Set<FoodGroup>()
  for (const food of foods) for (const group of food.groups) seen.add(group)
  return { ...totals, groups: [...seen] }
}

/** "~420 kcal · P 12g · K 38g · Y 22g", or null when nothing could be counted. */
export function macroLine(totals: SofraTotals): string | null {
  if (totals.knownCount === 0) return null
  const round = (value: number) => String(Math.round(value))
  return `~${round(totals.kcal)} kcal · P ${round(totals.protein)}g · K ${round(
    totals.carb,
  )}g · Y ${round(totals.fat)}g`
}

/** The caveat, when part of the table could not be counted. */
export function unknownNote(totals: SofraTotals): string | null {
  if (totals.unknownCount === 0) return null
  return `${String(totals.unknownCount)} besin hesaba girmedi`
}
