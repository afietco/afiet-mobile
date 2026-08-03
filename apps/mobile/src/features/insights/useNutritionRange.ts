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
import type { ApiNutritionRange } from '@/data/api/client'
import { requireApi } from '@/data/api/apiHolder'
import { useLive, type LiveQueryResult } from '@/data/useLive'

const TABLES = ['meals', 'water', 'customFoods', 'profiles'] as const

/* The whole payload rather than just the days: the targets travel with it and
   the day sheet needs them to fill its rings. A day object carries everything
   @afiet/core's NutritionDay asks for, so the aggregate helpers take these
   straight. */
export function useNutritionRange(from: string, to: string): LiveQueryResult<ApiNutritionRange> {
  return useLive([...TABLES], () => requireApi().nutritionRange(from, to), [from, to])
}
