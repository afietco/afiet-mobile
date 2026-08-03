/**
 * The meal somebody logs before they have an account, held until there is one.
 *
 * Deliberately free of the seed catalogue: this module is reached from the
 * root layout (through the sign-out task list) and from the tabs layout, so
 * everything it imports is evaluated before the first frame. Creating a draft
 * does need the catalogue, and lives in firstMealDraft.ts for that reason.
 */
import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  MEAL_TYPES,
  type FoodGroup,
  type FoodMeasure,
  type MealType,
} from '@afiet/core'
import { mealRepo } from '../../data/repositories'
import { track } from '../../lib/track'

const STORAGE_KEY = 'afiet:onboarding:first-meal:v1'
const validGroups = new Set<string>(FOOD_GROUPS.map((group) => group.key))
const validMeasures = new Set<string>(FOOD_MEASURES.map((measure) => measure.key))
const validMeals = new Set<string>(MEAL_TYPES.map((meal) => meal.key))

export interface PendingFirstMeal {
  version: 1
  foodName: string
  date: string
  meal: MealType
  quantity: number
  measure: FoodMeasure
  groups: FoodGroup[]
  createdAt: string
  /** Whether the typed name matched the seed catalogue when the draft was made.
   *  Optional so drafts written by an earlier build still parse; those simply
   *  report themselves as custom entries in telemetry. */
  matchedSeed?: boolean
}

export function mealForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'kahvalti'
  if (hour >= 11 && hour < 15) return 'ogle'
  if (hour >= 17 && hour < 22) return 'aksam'
  return 'ara'
}

export function parsePendingFirstMeal(raw: string): PendingFirstMeal | null {
  try {
    const value = JSON.parse(raw) as Partial<PendingFirstMeal>
    if (
      value.version !== 1 ||
      typeof value.foodName !== 'string' ||
      value.foodName.trim().length === 0 ||
      typeof value.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.date) ||
      typeof value.meal !== 'string' ||
      !validMeals.has(value.meal) ||
      typeof value.quantity !== 'number' ||
      !Number.isFinite(value.quantity) ||
      value.quantity <= 0 ||
      typeof value.measure !== 'string' ||
      !validMeasures.has(value.measure) ||
      !Array.isArray(value.groups) ||
      !value.groups.every((group) => typeof group === 'string' && validGroups.has(group)) ||
      typeof value.createdAt !== 'string'
    ) {
      return null
    }
    return value as PendingFirstMeal
  } catch {
    return null
  }
}

export function readPendingFirstMeal(): PendingFirstMeal | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const pending = parsePendingFirstMeal(raw)
    if (!pending) localStorage.removeItem(STORAGE_KEY)
    return pending
  } catch {
    return null
  }
}

export function savePendingFirstMeal(entry: PendingFirstMeal): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry))
}

export function clearPendingFirstMeal(): void {
  localStorage.removeItem(STORAGE_KEY)
}

let syncInFlight: Promise<boolean> | null = null

export function syncPendingFirstMeal(profileId: number): Promise<boolean> {
  if (syncInFlight) return syncInFlight
  const pending = readPendingFirstMeal()
  if (!pending) return Promise.resolve(false)

  syncInFlight = mealRepo
    .add({
      profileId,
      date: pending.date,
      meal: pending.meal,
      foodName: pending.foodName,
      quantity: pending.quantity,
      measure: pending.measure,
      groups: pending.groups,
      createdAt: pending.createdAt,
    })
    .then(() => {
      track('meal_logged', {
        meal: pending.meal,
        group_count: pending.groups.length,
        source: pending.matchedSeed ? 'seed' : 'custom',
      })
      clearPendingFirstMeal()
      return true
    })
    .finally(() => {
      syncInFlight = null
    })
  return syncInFlight
}
