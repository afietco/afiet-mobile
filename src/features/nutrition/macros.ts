import { findSeedFood } from '../../data/foods'
import type { Macros, MealEntry } from '../../data/types'

/** Vücut bilgileri eksikken kullanılan genel enerji referansı (kcal/gün) */
export const FALLBACK_TDEE = 2000

export interface DayMacros extends Macros {
  /** Makrosu bilinen (seed listesindeki) kayıt sayısı */
  knownCount: number
  /** Listede olmayan, hesaba katılamayan kayıt sayısı */
  unknownCount: number
}

/** Kaydın yaklaşık makroları (miktarla çarpılmış) — seed listesinde yoksa null */
export function entryMacros(entry: MealEntry): Macros | null {
  const seed = findSeedFood(entry.foodName)
  if (!seed) return null
  const qty = entry.quantity || 1
  return {
    kcal: seed.macros.kcal * qty,
    protein: seed.macros.protein * qty,
    carb: seed.macros.carb * qty,
    fat: seed.macros.fat * qty,
  }
}

/** Günün yaklaşık makro toplamı — yalnızca makrosu bilinen besinler sayılır */
export function dayMacros(entries: MealEntry[]): DayMacros {
  const total: DayMacros = { kcal: 0, protein: 0, carb: 0, fat: 0, knownCount: 0, unknownCount: 0 }
  for (const e of entries) {
    const m = entryMacros(e)
    if (!m) {
      total.unknownCount++
      continue
    }
    total.knownCount++
    total.kcal += m.kcal
    total.protein += m.protein
    total.carb += m.carb
    total.fat += m.fat
  }
  return total
}
