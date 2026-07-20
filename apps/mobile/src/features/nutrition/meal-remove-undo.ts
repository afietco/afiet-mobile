import type { MealEntry } from '@afiet/core'

/** Copies a removed meal without its obsolete identifier so it can be restored. */
export function createRestoredMealEntry(entry: MealEntry): Omit<MealEntry, 'id'> {
  return {
    profileId: entry.profileId,
    date: entry.date,
    meal: entry.meal,
    foodName: entry.foodName,
    portionSize: entry.portionSize,
    quantity: entry.quantity,
    measure: entry.measure,
    groups: entry.groups,
    note: entry.note,
    createdAt: entry.createdAt,
  }
}
