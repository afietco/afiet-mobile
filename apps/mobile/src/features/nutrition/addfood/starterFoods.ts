import { turkishLower, type MealType } from '@afiet/core'
import { SEED_FOODS, type SeedFood } from '@afiet/core/foods'
import type { FoodSearchRow } from './foodSearch'

/**
 * Something to tap before anything has been typed.
 *
 * The search step used to open on nothing. With the keyboard up and Afi
 * animating above it, a first-time account got one faint apology where the
 * list should be ("menüne kaydettiğin besinler burada çıkar"), because the
 * only thing offered before a query was the person's own saved menu and a new
 * account has no menu. So the step asked people to type the name of a food out
 * of a catalogue they had never seen, with no way to find out what was in it.
 *
 * The catalogue already knows which meals a food belongs to (`suitableMeals`),
 * so the empty state can be answered from it: a short, meal-appropriate set of
 * everyday foods. Not a recommendation and not a ranking, just the shortest
 * path from "I ate breakfast" to a row worth touching.
 */

/**
 * Hand-picked per meal, by name.
 *
 * Deliberately a list rather than a query. `suitableMeals` is true of hundreds
 * of foods per meal and any automatic cut through them (first N, most common
 * groups, shortest name) produces a set that reads as arbitrary: pilaf next to
 * dried figs next to instant soup. These are the things people actually eat at
 * each meal, ordered the way a person would think of them, and a wrong name
 * here costs nothing because unknown names are dropped rather than shown.
 */
const STARTERS: Record<MealType, string[]> = {
  kahvalti: [
    'Beyaz peynir',
    'Yumurta',
    'Zeytin',
    'Domates',
    'Salatalık',
    'Bal',
    'Tereyağı',
    'Simit',
  ],
  ogle: [
    'Mercimek çorbası',
    'Tavuk şiş',
    'Pirinç pilavı',
    'Çoban salata',
    'Yoğurt',
    'Kuru fasulye',
    'Bulgur pilavı',
    'Ayran',
  ],
  aksam: [
    'Sulu köfte',
    'Ayşekadın fasulye',
    'Pirinç pilavı',
    'Yoğurt',
    'Çoban salata',
    'Mercimek çorbası',
    'Tavuk sote',
    'Karnıyarık',
  ],
  ara: ['Elma', 'Muz', 'Ceviz', 'Badem', 'Yoğurt', 'Kuru kayısı', 'Kefir', 'Çay'],
}

/**
 * Name lookup over the catalogue, built once.
 *
 * `findSeedFood` walks 2000 entries per call and this asks for eight names
 * every time the meal changes, which is the sort of thing that only shows up
 * on the oldest phone someone owns.
 */
let byName: Map<string, SeedFood> | null = null

function catalogueByName(): Map<string, SeedFood> {
  if (byName) return byName
  const map = new Map<string, SeedFood>()
  for (const food of SEED_FOODS) map.set(turkishLower(food.name), food)
  byName = map
  return map
}

/**
 * Starter rows for a meal, in the shape the list already draws.
 *
 * A name the catalogue does not carry is skipped rather than rendered as a
 * dead row: the catalogue is edited from the admin panel and a food can be
 * renamed out from under this list at any time.
 */
export function starterRows(meal: MealType | null, limit = 6): FoodSearchRow[] {
  const names = STARTERS[meal ?? 'ara']
  const catalogue = catalogueByName()
  const rows: FoodSearchRow[] = []
  for (const name of names) {
    const food = catalogue.get(turkishLower(name))
    if (!food) continue
    rows.push({
      key: `starter:${turkishLower(food.name)}`,
      name: food.name,
      groups: food.groups,
      measure: food.measure,
      origin: 'catalog',
      emoji: food.emoji,
      exact: false,
    })
    if (rows.length >= limit) break
  }
  return rows
}
