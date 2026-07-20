import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  MEAL_TYPES,
  findSeedFood,
  toISODate,
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
}

export function mealForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'kahvalti'
  if (hour >= 11 && hour < 15) return 'ogle'
  if (hour >= 17 && hour < 22) return 'aksam'
  return 'ara'
}

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
  }
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
        source: findSeedFood(pending.foodName) ? 'seed' : 'custom',
      })
      clearPendingFirstMeal()
      return true
    })
    .finally(() => {
      syncInFlight = null
    })
  return syncInFlight
}
