import type { FoodGroup, FoodMeasure, MealType } from '@afiet/core'
import { requireApi } from '@/data/api/apiHolder'
import type { ApiSofra, ApiSofraInput } from '@/data/api/client'
import { notify } from '@/data/live'
import { useLive, type LiveQueryResult } from '@/data/useLive'

/**
 * Sofra: birlikte yenen besinlerin kaydı.
 *
 * Menüm tek tek besinleri öğrenir; sofra bunların birlikte yendiği hâlidir.
 * Aynı kahvaltı çoğu zaman aynı beş şeydir ve her sabah beşi de tek tek
 * aranıp tek tek ekleniyordu.
 *
 * Öğün zamanı sofranın KENDİ alanı, içindekilerden türetilmiyor. Katalog bir
 * besnin hangi öğüne yakıştığını bilir ama bu soruyu bir küme için
 * cevaplayamaz: yoğurt her öğüne yakışır, "akşam sofram" yakışmaz. Kullanıcı
 * sofrayı kurarken söyler.
 */

export interface SofraFood {
  name: string
  groups: FoodGroup[]
  measure: FoodMeasure | null
  quantity: number
}

export interface Sofra {
  id: string
  name: string
  /** Empty means every meal; the add-food filter reads it that way. */
  meals: MealType[]
  foods: SofraFood[]
}

export interface SofraDraft {
  name: string
  meals: MealType[]
  foods: SofraFood[]
}

/** A sofra needs a name and something on it before it can be saved. */
export function isSofraSaveable(draft: SofraDraft): boolean {
  return draft.name.trim().length > 0 && draft.foods.length > 0
}

/**
 * The sofras worth offering for a meal.
 *
 * A sofra with no meals is offered everywhere: it was saved without an opinion
 * about when it belongs, and hiding it from every meal would make it saveable
 * but unreachable. Asked for a null meal, everything is offered, because a
 * flow that does not know the meal yet cannot narrow anything honestly.
 */
export function sofrasForMeal(sofras: readonly Sofra[], meal: MealType | null): Sofra[] {
  if (meal === null) return [...sofras]
  return sofras.filter((sofra) => sofra.meals.length === 0 || sofra.meals.includes(meal))
}

/** Kaç besin ve ilk birkaçının adı; listede tek satırlık özet. */
export function sofraSummary(sofra: Sofra, limit = 3): string {
  const names = sofra.foods.slice(0, limit).map((food) => food.name)
  const rest = sofra.foods.length - names.length
  return rest > 0 ? `${names.join(' · ')} +${String(rest)}` : names.join(' · ')
}

function toSofra(api: ApiSofra): Sofra {
  return {
    id: api.id,
    name: api.name,
    meals: api.meals as MealType[],
    foods: api.foods.map((food) => ({
      name: food.name,
      groups: food.groups as FoodGroup[],
      measure: (food.measure as FoodMeasure | null) ?? null,
      quantity: food.quantity,
    })),
  }
}

function toInput(draft: SofraDraft): ApiSofraInput {
  return {
    name: draft.name.trim(),
    meals: draft.meals,
    foods: draft.foods.map((food) => ({
      name: food.name,
      groups: food.groups,
      measure: food.measure,
      quantity: food.quantity,
    })),
  }
}

export function useSofrasResult(): LiveQueryResult<Sofra[]> {
  return useLive(['sofras'], async () => (await requireApi().listSofras()).map(toSofra), [])
}

export async function saveSofra(draft: SofraDraft, id?: string): Promise<Sofra> {
  const api = id
    ? await requireApi().updateSofra(id, toInput(draft))
    : await requireApi().addSofra(toInput(draft))
  notify('sofras')
  return toSofra(api)
}

export async function deleteSofra(id: string): Promise<void> {
  await requireApi().deleteSofra(id)
  notify('sofras')
}
