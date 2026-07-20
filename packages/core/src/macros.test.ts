import { describe, expect, it } from 'vitest'
import { dayMacros, entryMacros } from './macros'
import type { CustomFood, FoodGroup, MealEntry } from './types'

function mealEntry(foodName: string, quantity = 1, groups: FoodGroup[] = []): MealEntry {
  return {
    profileId: 1,
    date: '2026-07-20',
    meal: 'ogle',
    foodName,
    quantity,
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
