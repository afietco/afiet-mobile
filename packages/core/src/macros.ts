import { findSeedFood } from './foods'
import { turkishLower } from './turkish'
import type { CustomFood, Macros, MealEntry } from './types'

/** Vücut bilgileri eksikken kullanılan genel enerji referansı (kcal/gün) */
export const FALLBACK_TDEE = 2000

export interface DayMacros extends Macros {
  /** Makrosu bilinen (seed listesindeki) kayıt sayısı */
  knownCount: number
  /** Listede olmayan, hesaba katılamayan kayıt sayısı */
  unknownCount: number
}

/** Kaydın yaklaşık makroları (miktarla çarpılmış); seed ya da makrolu menü besini değilse null */
export function entryMacros(entry: MealEntry, customFoods?: CustomFood[]): Macros | null {
  const q = turkishLower(entry.foodName.trim())
  const base =
    findSeedFood(entry.foodName)?.macros ??
    customFoods?.find((f) => turkishLower(f.name) === q)?.macros
  if (!base) return null
  const qty = entry.quantity || 1
  return {
    kcal: base.kcal * qty,
    protein: base.protein * qty,
    carb: base.carb * qty,
    fat: base.fat * qty,
  }
}

/** Günün yaklaşık makro toplamı; yalnızca makrosu bilinen besinler sayılır */
export function dayMacros(entries: MealEntry[], customFoods?: CustomFood[]): DayMacros {
  const total: DayMacros = { kcal: 0, protein: 0, carb: 0, fat: 0, knownCount: 0, unknownCount: 0 }
  for (const e of entries) {
    const m = entryMacros(e, customFoods)
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
