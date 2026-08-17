import { MEAL_TYPES, turkishLower, type MealEntry, type MealType } from '@afiet/core'
import type { SofraDraft, SofraFood } from '@/features/nutrition/sofra'

/**
 * The signal behind "Sofranı tanı": the same food written on more than one
 * day. One day with the same tea twice is not a habit; two mornings with the
 * same tea is the beginning of one, and the beginning is when a saved sofra
 * starts paying for itself.
 */

/** How far back the search for a habit looks. */
export const REPEAT_HISTORY_DAYS = 30
/** How many foods the offered sofra carries at most. */
const SOFRA_FOOD_LIMIT = 6

export interface RepeatedFood {
  /** The most recent spelling of the name. */
  name: string
  /** Distinct days it was logged on. */
  days: number
  /** The meal it belongs to most often. */
  meal: MealType
  latest: MealEntry
}

/** Foods logged on two or more different days, most habitual first. */
export function repeatedFoods(entries: readonly MealEntry[]): RepeatedFood[] {
  const byName = new Map<
    string,
    { days: Set<string>; meals: Map<MealType, number>; latest: MealEntry }
  >()
  for (const entry of entries) {
    const key = turkishLower(entry.foodName.trim())
    if (!key || entry.groups.length === 0) continue
    const tally = byName.get(key) ?? { days: new Set(), meals: new Map(), latest: entry }
    tally.days.add(entry.date)
    tally.meals.set(entry.meal, (tally.meals.get(entry.meal) ?? 0) + 1)
    if (entry.createdAt > tally.latest.createdAt) tally.latest = entry
    byName.set(key, tally)
  }

  const repeats: RepeatedFood[] = []
  for (const tally of byName.values()) {
    if (tally.days.size < 2) continue
    let meal: MealType = tally.latest.meal
    let best = 0
    for (const [candidate, count] of tally.meals) {
      if (count > best) {
        best = count
        meal = candidate
      }
    }
    repeats.push({ name: tally.latest.foodName, days: tally.days.size, meal, latest: tally.latest })
  }
  return repeats.sort((a, b) => b.days - a.days || a.name.localeCompare(b.name, 'tr'))
}

function toSofraFood(repeat: RepeatedFood): SofraFood {
  return {
    name: repeat.name,
    groups: repeat.latest.groups,
    measure: repeat.latest.measure ?? null,
    quantity: repeat.latest.quantity > 0 ? repeat.latest.quantity : 1,
  }
}

/**
 * The sofra offered from what repeats: the meal the strongest habit belongs
 * to, every repeated food of that meal, and a name the person can keep or
 * change. Nothing is invented; every food on it was already written twice.
 */
export function sofraDraftFromRepeats(repeats: readonly RepeatedFood[]): SofraDraft | null {
  const lead = repeats[0]
  if (!lead) return null
  const meal = lead.meal
  const foods = repeats
    .filter((repeat) => repeat.meal === meal)
    .slice(0, SOFRA_FOOD_LIMIT)
    .map(toSofraFood)
  const label = MEAL_TYPES.find((type) => type.key === meal)?.label ?? 'Sofram'
  return { name: `${label} sofram`, meals: [meal], foods }
}
