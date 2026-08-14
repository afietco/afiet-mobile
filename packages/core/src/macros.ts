import { findSeedFood } from './foods'
import { turkishLower } from './turkish'
import type { CustomFood, FoodMeasure, Macros, MealEntry } from './types'

/** Vücut bilgileri eksikken kullanılan genel enerji referansı (kcal/gün) */
export const FALLBACK_TDEE = 2000

export interface DayMacros extends Macros {
  /** Makrosu bilinen (seed listesindeki) kayıt sayısı */
  knownCount: number
  /** Listede olmayan, hesaba katılamayan kayıt sayısı */
  unknownCount: number
}

/**
 * How many "one measure" servings an entry is worth.
 *
 * Macros are always written for ONE measure of the food, and until now this
 * scaling was a bare multiplication by the quantity: a food measured in
 * porsiyon, logged as "3 kaşık", counted as three whole porsiyon. The measure
 * was never read, so switching it in the UI silently tripled a meal.
 *
 * Only two conversions are honest with the data we carry. Same measure is
 * one-to-one, and grams divide by the food's own gram weight
 * (`SeedFood.gramPerMeasure`). Everything else, a kaşık of a porsiyon dish,
 * would need a per-food weight for that measure which nothing in the catalogue
 * knows, so it returns null and the caller counts the entry as unknown rather
 * than inventing a number. `allowedMeasures` is the same rule read forwards:
 * the UI only ever offers what this can convert back.
 */
export function measureServings(
  entryMeasure: FoodMeasure | undefined,
  baseMeasure: FoodMeasure | undefined,
  quantity: number,
  gramPerMeasure?: number,
): number | null {
  const qty = quantity || 1
  /* An entry written before measures were recorded, or a menu food saved
     without one, is taken at its base measure: that is what the number meant
     when it was written. */
  if (entryMeasure === undefined || baseMeasure === undefined) return qty
  if (entryMeasure === baseMeasure) return qty
  if (entryMeasure === 'gram' && gramPerMeasure !== undefined && gramPerMeasure > 0) {
    return qty / gramPerMeasure
  }
  return null
}

/**
 * The measures a food may be logged in without inventing numbers.
 *
 * The inverse of `measureServings`: a measure is offered only when the macros
 * can be scaled back to it. That is the food's own measure, plus grams when the
 * catalogue knows what one measure weighs. A food already measured in grams has
 * nothing to add, and a menu food (no gram weight of its own) keeps its single
 * measure.
 */
export function allowedMeasures(
  baseMeasure: FoodMeasure | undefined,
  gramPerMeasure?: number,
): FoodMeasure[] {
  const base = baseMeasure ?? 'porsiyon'
  if (base === 'gram' || gramPerMeasure === undefined || gramPerMeasure <= 0) return [base]
  return [base, 'gram']
}

/**
 * The three things a macro calculation needs from anything it is asked about.
 *
 * A meal entry satisfies it, and so does a sofra food, which is why it exists:
 * a saved table is the same arithmetic as a logged day, and having two of them
 * is how the two answers start disagreeing.
 */
export interface MacroSubject {
  foodName: string
  measure?: FoodMeasure
  quantity: number
}

/** Bir kalemin yaklaşık makroları (ölçüsüne göre ölçeklenmiş); çevrilemiyorsa null */
export function subjectMacros(subject: MacroSubject, customFoods?: CustomFood[]): Macros | null {
  const seed = findSeedFood(subject.foodName)
  const q = turkishLower(subject.foodName.trim())
  const custom = seed ? undefined : customFoods?.find((f) => turkishLower(f.name) === q)
  const base = seed?.macros ?? custom?.macros
  if (!base) return null
  const servings = measureServings(
    subject.measure,
    seed?.measure ?? custom?.measure,
    subject.quantity,
    seed?.gramPerMeasure,
  )
  if (servings === null) return null
  return {
    kcal: base.kcal * servings,
    protein: base.protein * servings,
    carb: base.carb * servings,
    fat: base.fat * servings,
  }
}

/** Kaydın yaklaşık makroları (ölçüsüne göre ölçeklenmiş); çevrilemiyorsa null */
export function entryMacros(entry: MealEntry, customFoods?: CustomFood[]): Macros | null {
  return subjectMacros(entry, customFoods)
}

/**
 * The total of anything with a name, a measure and an amount, plus how much of
 * it could be counted. A sofra reads this the same way a day does.
 */
export function sumMacros(
  subjects: readonly MacroSubject[],
  customFoods?: CustomFood[],
): DayMacros {
  const total: DayMacros = { kcal: 0, protein: 0, carb: 0, fat: 0, knownCount: 0, unknownCount: 0 }
  for (const subject of subjects) {
    const m = subjectMacros(subject, customFoods)
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

/** Günün yaklaşık makro toplamı; yalnızca makrosu bilinen besinler sayılır */
export function dayMacros(entries: MealEntry[], customFoods?: CustomFood[]): DayMacros {
  return sumMacros(entries, customFoods)
}
