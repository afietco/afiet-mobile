/**
 * Day by day nutrition for the "Değerler" tab.
 *
 * The endpoint returns every date in the window, including the ones with
 * nothing on them, and that is load bearing: an empty day has to stay
 * distinguishable from a day of eating nothing (see @afiet/core
 * summarizeNutritionWindow). The response is therefore passed through
 * untouched rather than filtered here.
 *
 * Fiber is deliberately not part of this. The catalogue stores it per food but
 * custom foods do not carry it, so a total would be silently short for anyone
 * who logs their own foods, and a number that is quietly wrong is worse than
 * one that is missing.
 */
import type { NutritionDay } from '@afiet/core'
import { requireApi } from '@/data/api/apiHolder'
import { useLive, type LiveQueryResult } from '@/data/useLive'

const TABLES = ['meals', 'water', 'customFoods', 'profiles'] as const

export function useNutritionRange(from: string, to: string): LiveQueryResult<NutritionDay[]> {
  return useLive(
    [...TABLES],
    async () => (await requireApi().nutritionRange(from, to)).days,
    [from, to],
  )
}
