import { MEAL_TYPES, type FoodGroup, type MealEntry, type MealType } from '@afiet/core'

/**
 * How the balance card's two extra pages read the day.
 *
 * Pure and separate from the pager that draws it, the way `meal-shortcuts` and
 * `foodSearch` are: the vitest project only collects `.ts`, so anything that
 * lives beside JSX cannot be covered at all.
 */

export interface MealSection {
  meal: MealType
  label: string
  entries: MealEntry[]
}

/**
 * The meals that actually have something in them, in the day's own order.
 *
 * Ordered by `MEAL_TYPES` rather than by when things were logged: the page is
 * read as a day, and a breakfast entered after dinner still happened first.
 * Empty meals are left out entirely, because an unlogged meal is Afi's to
 * mention and this page only reports what the day was.
 */
export function mealSections(entries: readonly MealEntry[]): MealSection[] {
  return MEAL_TYPES.map((meal) => ({
    meal: meal.key,
    label: meal.label,
    entries: entries.filter((entry) => entry.meal === meal.key),
  })).filter((section) => section.entries.length > 0)
}

/** Every food group the given entries touched, each once, in first-seen order. */
export function groupsOf(entries: readonly MealEntry[]): FoodGroup[] {
  const seen = new Set<FoodGroup>()
  for (const entry of entries) for (const group of entry.groups) seen.add(group)
  return [...seen]
}
