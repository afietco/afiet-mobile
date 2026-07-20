import type { FoodGroup } from '@afiet/core'

/** A meal can affect balance only when it has a name and at least one food group. */
export function canSaveMealEntry(name: string, groups: readonly FoodGroup[]): boolean {
  return name.trim().length > 0 && groups.length > 0
}
