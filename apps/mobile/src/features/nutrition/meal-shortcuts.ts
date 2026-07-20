import { turkishLower, type MealEntry, type MealRepository, type MealType } from '@afiet/core'

export const MEAL_SHORTCUT_HISTORY_DAYS = 7

/** Returns the latest usable entry for each food name. */
export function recentMealShortcuts(entries: readonly MealEntry[], limit = 6): MealEntry[] {
  const seen = new Set<string>()
  return [...entries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((entry) => {
      const key = turkishLower(entry.foodName.trim())
      if (!key || entry.groups.length === 0 || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, limit)
}

/** Selects the entries that made up one meal on a specific day. */
export function entriesForMeal(
  entries: readonly MealEntry[],
  date: string,
  meal: MealType,
): MealEntry[] {
  return entries.filter((entry) => entry.date === date && entry.meal === meal)
}

interface RepeatMealTarget {
  profileId: number
  date: string
  meal: MealType
  createdAt: string
}

/** Copies a meal and removes any partial copies if a later write fails. */
export async function repeatMealEntries(
  repo: Pick<MealRepository, 'add' | 'remove'>,
  entries: readonly MealEntry[],
  target: RepeatMealTarget,
): Promise<void> {
  const createdIds: number[] = []
  try {
    for (const entry of entries) {
      const id = await repo.add({
        profileId: target.profileId,
        date: target.date,
        meal: target.meal,
        foodName: entry.foodName,
        portionSize: entry.portionSize,
        quantity: entry.quantity,
        measure: entry.measure,
        groups: entry.groups,
        note: entry.note,
        createdAt: target.createdAt,
      })
      createdIds.push(id)
    }
  } catch (error) {
    await Promise.allSettled([...createdIds].reverse().map((id) => repo.remove(id)))
    throw error
  }
}
