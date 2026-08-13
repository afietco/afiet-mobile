import { turkishLower, type CustomFood } from '@afiet/core'
import { findSeedFood, searchSeedFoods, type SeedFood } from '@afiet/core/foods'
import type { FoodChoice } from './contract'

/**
 * Row building for the add-food search step.
 *
 * Pure on purpose: the step renders what this module returns, so the matching
 * rules can be tested without a renderer. Matching itself is delegated to the
 * catalogue helpers in @afiet/core, this module only merges, de-duplicates and
 * orders the two sources the user can pick from.
 */

/** A pickable row: a resolved food choice plus what the list needs to draw it. */
export interface FoodSearchRow extends FoodChoice {
  /** Stable list key. Rows are unique by normalized name, so this is unique too. */
  key: string
  /** The catalogue or menu entry whose name is exactly what the user typed. */
  exact: boolean
  /** Small visual hint carried by catalogue foods; menu foods have none. */
  emoji?: string
}

/** Rows offered for a query. Short by design: this list is scanned, not browsed. */
export const FOOD_SEARCH_LIMIT = 8

/** Menu entries offered when the query is still empty. */
export const MENU_PREVIEW_LIMIT = 6

/**
 * Catalogue candidates asked for per query. Larger than the visible limit so
 * de-duplication against the menu cannot leave the list short.
 */
const SEED_POOL = FOOD_SEARCH_LIMIT * 3

export function seedRow(food: SeedFood, exact: boolean): FoodSearchRow {
  return {
    key: `catalog:${turkishLower(food.name)}`,
    name: food.name,
    groups: food.groups,
    measure: food.measure,
    origin: 'catalog',
    emoji: food.emoji,
    gramPerMeasure: food.gramPerMeasure,
    exact,
  }
}

function menuRow(food: CustomFood, exact: boolean): FoodSearchRow {
  return {
    key: `menu:${turkishLower(food.name)}`,
    name: food.name,
    groups: food.groups,
    measure: food.measure,
    origin: 'menu',
    exact,
  }
}

/**
 * Builds the result rows for a typed query.
 *
 * The exact match leads the list and is marked. It used to be filtered out
 * (`key === q` was excluded), so a food vanished the moment its name was
 * finished, which is exactly when the user reaches for the row. It now stays,
 * once: `seen` still removes real duplicates, including a second copy of the
 * exact match coming from the catalogue scan.
 *
 * The user's own menu outranks the catalogue: a food they saved themselves
 * carries their measure and their macros.
 */
export function buildFoodSearchRows(
  query: string,
  menu: readonly CustomFood[],
  limit: number = FOOD_SEARCH_LIMIT,
): FoodSearchRow[] {
  const normalizedQuery = turkishLower(query.trim())
  if (!normalizedQuery) return []

  const rows: FoodSearchRow[] = []
  const seen = new Set<string>()
  const push = (row: FoodSearchRow) => {
    const key = turkishLower(row.name)
    if (seen.has(key)) return
    seen.add(key)
    rows.push(row)
  }

  const menuExact = menu.find((food) => turkishLower(food.name) === normalizedQuery)
  const seedExact = findSeedFood(query)
  if (menuExact) push(menuRow(menuExact, true))
  else if (seedExact) push(seedRow(seedExact, true))

  for (const food of menu) {
    if (turkishLower(food.name).includes(normalizedQuery)) push(menuRow(food, false))
  }
  for (const food of searchSeedFoods(query, SEED_POOL)) push(seedRow(food, false))

  return rows.slice(0, limit)
}

/**
 * The user's saved menu, alphabetical like the Menüm screen and capped, so the
 * step stays the same size whether five or five hundred foods are saved.
 */
export function buildMenuRows(
  menu: readonly CustomFood[],
  limit: number = MENU_PREVIEW_LIMIT,
): FoodSearchRow[] {
  return [...menu]
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    .slice(0, limit)
    .map((food) => menuRow(food, false))
}
