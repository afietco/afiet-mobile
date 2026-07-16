import type { MealType } from '@afiet/core'

/**
 * Widget derin bağlantısı köprüsü: afiet://ekle?ogun=... rotası öğünü
 * buraya bırakır, Bugün ekranı tüketip Besin Ekle sheet'ini o öğünle açar.
 * Tek seferliktir; tüketilince temizlenir.
 */

const MEALS: MealType[] = ['kahvalti', 'ogle', 'aksam', 'ara']

let pending: MealType | null = null
const listeners = new Set<() => void>()

export function setPendingAdd(raw: string | undefined) {
  pending = MEALS.includes(raw as MealType) ? (raw as MealType) : 'ara'
  for (const l of listeners) l()
}

export function consumePendingAdd(): MealType | null {
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
