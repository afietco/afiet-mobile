/**
 * Turning what somebody typed on the first-meal screen into a pending entry.
 *
 * Split out from pendingFirstMeal.ts because this is the only step that needs
 * the seed catalogue, and that catalogue is 1.1 MB of literals. The rest of
 * the pending-meal handling (reading it, syncing it, clearing it on sign-out)
 * is reached from the root layout, so anything it imports is evaluated before
 * the app can paint. This file is reached only from the first-meal route.
 */
import { toISODate } from '@afiet/core'
import { findSeedFood } from '@afiet/core/foods'
import { mealForHour, type PendingFirstMeal } from './pendingFirstMeal'

export function createPendingFirstMeal(rawName: string, now = new Date()): PendingFirstMeal {
  const trimmed = rawName.trim()
  const matched = findSeedFood(trimmed)
  return {
    version: 1,
    foodName: matched?.name ?? trimmed,
    date: toISODate(now),
    meal: mealForHour(now.getHours()),
    quantity: matched?.defaultQuantity ?? 1,
    measure: matched?.measure ?? 'porsiyon',
    groups: matched?.groups ?? [],
    createdAt: now.toISOString(),
    /* Recorded here rather than looked up again at sync time: the lookup is
       the reason this module is heavy, and the answer is already known at the
       one moment the catalogue is loaded anyway. */
    matchedSeed: matched !== undefined,
  }
}
