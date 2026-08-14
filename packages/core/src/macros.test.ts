import { describe, expect, it } from 'vitest'
import { allowedMeasures, dayMacros, entryMacros, measureServings } from './macros'
import type { CustomFood, FoodGroup, FoodMeasure, MealEntry } from './types'

function mealEntry(
  foodName: string,
  quantity = 1,
  groups: FoodGroup[] = [],
  measure?: FoodMeasure,
): MealEntry {
  return {
    profileId: 1,
    date: '2026-07-20',
    meal: 'ogle',
    foodName,
    quantity,
    measure,
    groups,
    createdAt: '2026-07-20T12:00:00.000Z',
  }
}

describe('macro calculations', () => {
  it('scales seed-food macros by quantity', () => {
    expect(entryMacros(mealEntry('Beyaz peynir', 2))).toEqual({
      kcal: 160,
      protein: 10,
      carb: 1,
      fat: 13,
    })
  })

  it('uses custom-food macros and ignores unknown foods', () => {
    const customFoods: CustomFood[] = [
      {
        name: 'Ev keki',
        groups: ['tahil', 'tatli'],
        macros: { kcal: 150, protein: 3, carb: 20, fat: 7 },
      },
    ]

    expect(entryMacros(mealEntry('EV KEKİ', 2), customFoods)).toEqual({
      kcal: 300,
      protein: 6,
      carb: 40,
      fat: 14,
    })
    expect(entryMacros(mealEntry('Bilinmeyen yemek'), customFoods)).toBeNull()
  })

  it('totals known entries and counts unknown entries separately', () => {
    const customFoods: CustomFood[] = [
      {
        name: 'Ev keki',
        groups: ['tahil', 'tatli'],
        macros: { kcal: 150, protein: 3, carb: 20, fat: 7 },
      },
    ]
    const total = dayMacros(
      [mealEntry('Beyaz peynir', 2), mealEntry('Ev keki'), mealEntry('Bilinmeyen yemek')],
      customFoods,
    )

    expect(total).toEqual({
      kcal: 310,
      protein: 13,
      carb: 21,
      fat: 20,
      knownCount: 2,
      unknownCount: 1,
    })
  })
})

describe('measure conversion', () => {
  it('scales grams by the gram weight of one measure', () => {
    // Beyaz peynir: 1 dilim = 30 g, 80 kcal. 60 g is therefore two slices.
    expect(entryMacros(mealEntry('Beyaz peynir', 60, [], 'gram'))).toEqual({
      kcal: 160,
      protein: 10,
      carb: 1,
      fat: 13,
    })
  })

  it('takes an entry at its own measure when the two agree', () => {
    expect(entryMacros(mealEntry('Beyaz peynir', 2, [], 'dilim'))).toEqual({
      kcal: 160,
      protein: 10,
      carb: 1,
      fat: 13,
    })
  })

  it('refuses a measure it cannot convert instead of multiplying it', () => {
    // The old bug: "3 kaşık" of a per-dilim food counted as three whole slices.
    expect(entryMacros(mealEntry('Beyaz peynir', 3, [], 'kasik'))).toBeNull()
    expect(dayMacros([mealEntry('Beyaz peynir', 3, [], 'kasik')])).toMatchObject({
      kcal: 0,
      knownCount: 0,
      unknownCount: 1,
    })
  })

  it('reads an entry with no measure at the food default', () => {
    expect(measureServings(undefined, 'dilim', 2, 30)).toBe(2)
  })

  it('offers grams only where a gram weight is known', () => {
    expect(allowedMeasures('dilim', 30)).toEqual(['dilim', 'gram'])
    expect(allowedMeasures('porsiyon')).toEqual(['porsiyon'])
    expect(allowedMeasures('gram', 1)).toEqual(['gram'])
    expect(allowedMeasures(undefined)).toEqual(['porsiyon'])
  })
})
