import { turkishLower, type MealEntry, type MealType } from '@afiet/core'
import { findSeedFood } from '@afiet/core/foods'
import type { FoodSearchRow } from './foodSearch'
import { seedRow } from './foodSearch'
import { starterRows } from './starterFoods'

/**
 * "Afi'nin senin için seçtikleri": the foods this person actually eats.
 *
 * The drawer above this one used to hold a hand-written list of eight everyday
 * foods per meal (`starterFoods.ts`), which is a fine answer for somebody who
 * has never logged anything and a poor one for everybody else: a person who
 * writes menemen every morning was still offered simit and honey. The list now
 * starts from their own record and falls back to the written one only to fill
 * the empty slots, so a new account still opens on something worth tapping.
 *
 * Nothing here is a recommendation. It is the person's own history, read back
 * to them in the order they are likely to want it, which is why the ranking is
 * plain and explainable rather than clever: how often, then how recently.
 */

/** How far back the ranking looks. Long enough to catch a weekly habit. */
export const PERSONAL_HISTORY_DAYS = 30

interface Tally {
  entry: MealEntry
  count: number
  /** The most recent `createdAt` seen for this name; ISO strings sort as text. */
  last: string
}

/**
 * Builds a row for a food out of a past entry.
 *
 * The catalogue is asked first so a known food keeps its emoji, its measure and
 * its gram weight; a food that only lives in the person's menu is drawn from
 * the entry itself, which already carries everything the flow needs to resolve
 * it (name, groups, measure).
 */
function historyRow(entry: MealEntry): FoodSearchRow {
  const seed = findSeedFood(entry.foodName)
  if (seed) return { ...seedRow(seed, false), key: `personal:${turkishLower(seed.name)}` }
  return {
    key: `personal:${turkishLower(entry.foodName)}`,
    name: entry.foodName,
    groups: entry.groups,
    measure: entry.measure,
    origin: 'menu',
    exact: false,
  }
}

/**
 * The person's own foods for one meal, most-often first.
 *
 * Entries with no food group are skipped: they cannot move the balance, so
 * offering them again would only reproduce a record that says nothing.
 */
export function personalRows(
  entries: readonly MealEntry[],
  meal: MealType | null,
  limit: number,
): FoodSearchRow[] {
  const tallies = new Map<string, Tally>()
  for (const entry of entries) {
    if (meal !== null && entry.meal !== meal) continue
    if (entry.groups.length === 0) continue
    const key = turkishLower(entry.foodName.trim())
    if (!key) continue
    const seen = tallies.get(key)
    if (seen) {
      seen.count += 1
      // The newest entry represents the food: it carries the latest measure.
      if (entry.createdAt > seen.last) {
        seen.entry = entry
        seen.last = entry.createdAt
      }
      continue
    }
    tallies.set(key, { entry, count: 1, last: entry.createdAt })
  }

  return [...tallies.values()]
    .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
    .slice(0, limit)
    .map((tally) => historyRow(tally.entry))
}

/**
 * The drawer's final contents: history first, the written list behind it.
 *
 * Padding is deduplicated against what history already produced, so a food
 * somebody eats every week never appears twice under one heading.
 */
export function personalFoodRows(
  entries: readonly MealEntry[],
  meal: MealType | null,
  limit = 6,
): FoodSearchRow[] {
  const rows = personalRows(entries, meal, limit)
  if (rows.length >= limit) return rows
  const taken = new Set(rows.map((row) => turkishLower(row.name)))
  // Asked for enough candidates that overlap with history cannot leave the
  // drawer short of `limit`.
  for (const row of starterRows(meal, limit + rows.length)) {
    if (taken.has(turkishLower(row.name))) continue
    taken.add(turkishLower(row.name))
    rows.push(row)
    if (rows.length >= limit) break
  }
  return rows
}
