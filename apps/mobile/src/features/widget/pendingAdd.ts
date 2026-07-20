import type { MealType } from '@afiet/core'

/** One-shot bridge from the widget deep link to the Today add-food sheet. */

const MEALS: MealType[] = ['kahvalti', 'ogle', 'aksam', 'ara']

export interface PendingAddRequest {
  meal: MealType | null
  requiresMealSelection: boolean
}

let pending: PendingAddRequest | null = null
const listeners = new Set<() => void>()

export function setPendingAdd(raw: string | undefined) {
  const meal = MEALS.includes(raw as MealType) ? (raw as MealType) : null
  pending = { meal, requiresMealSelection: meal === null }
  for (const l of listeners) l()
}

export function consumePendingAdd(): PendingAddRequest | null {
  const p = pending
  pending = null
  return p
}

export function onPendingAdd(l: () => void): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
