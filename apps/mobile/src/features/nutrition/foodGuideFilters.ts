import {
  filterSeedFoods,
  type DietTag,
  type FoodGroup,
  type MealType,
  type SeedFood,
} from '@afiet/core'

/**
 * How the food guide is browsed rather than only searched.
 *
 * The guide held two thousand foods behind one search field and a fixed A-Z
 * of categories. That answers "where is the thing I already have a name for"
 * and nothing else: there was no way to ask what is vegan, what belongs at
 * breakfast, or what carries protein, even though the catalogue has held all
 * three facts per food since the enrichment pass. Someone who wanted to spend
 * time in here had nowhere to spend it.
 *
 * Filters are additive within a kind and combined across kinds, which is the
 * reading people expect from chips: two diet tags mean "either", a diet tag
 * and a meal mean "both".
 */

export interface FoodGuideFilter {
  /** Free text; the catalogue's own matcher handles names and aliases. */
  query: string
  /** Any of these groups; empty means no group constraint. */
  groups: FoodGroup[]
  /** Any of these tags; a food must carry the tag to pass. */
  dietTags: DietTag[]
  /** Any of these meals, read from the catalogue's `suitableMeals`. */
  meals: MealType[]
}

export const EMPTY_FOOD_FILTER: FoodGuideFilter = {
  query: '',
  groups: [],
  dietTags: [],
  meals: [],
}

/** Whether anything is narrowing the list beyond the plain catalogue. */
export function isFiltering(filter: FoodGuideFilter): boolean {
  return (
    filter.query.trim().length > 0 ||
    filter.groups.length > 0 ||
    filter.dietTags.length > 0 ||
    filter.meals.length > 0
  )
}

/** Adds or removes one value; chips toggle rather than replace. */
export function toggleFilterValue<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

function someOf<T>(selected: readonly T[], carried: readonly T[]): boolean {
  return selected.length === 0 || selected.some((value) => carried.includes(value))
}

/**
 * The foods that pass every kind of filter at once.
 *
 * Text goes through `filterSeedFoods` rather than a substring test here,
 * because that is what knows about aliases and Turkish casing; the rest is
 * plain set logic over fields the catalogue already carries.
 */
export function filterFoodGuide(filter: FoodGuideFilter): SeedFood[] {
  const byText = filterSeedFoods(filter.query)
  if (filter.groups.length === 0 && filter.dietTags.length === 0 && filter.meals.length === 0) {
    return byText
  }
  return byText.filter(
    (food) =>
      someOf(filter.groups, food.groups) &&
      someOf(filter.dietTags, food.dietTags) &&
      someOf(filter.meals, food.suitableMeals),
  )
}

/**
 * How many foods each group would leave, over the current text filter only.
 *
 * Counted against the text rather than against the other chips so a count
 * never drops to zero because of a sibling chip the person is about to turn
 * off. A chip that reads "0" is a dead end; a chip that reads the truth about
 * the catalogue is an invitation.
 */
export function groupCounts(query: string, groups: readonly FoodGroup[]): Map<FoodGroup, number> {
  const foods = filterSeedFoods(query)
  const counts = new Map<FoodGroup, number>()
  for (const group of groups) counts.set(group, 0)
  for (const food of foods) {
    for (const group of new Set(food.groups)) {
      const current = counts.get(group)
      if (current !== undefined) counts.set(group, current + 1)
    }
  }
  return counts
}
