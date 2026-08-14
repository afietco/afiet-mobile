import type { MealEntry } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import { personalFoodRows, personalRows } from './personalFoods'

function entry(
  foodName: string,
  createdAt: string,
  meal: MealEntry['meal'] = 'aksam',
  groups: MealEntry['groups'] = ['protein'],
): MealEntry {
  return {
    profileId: 1,
    date: createdAt.slice(0, 10),
    meal,
    foodName,
    quantity: 1,
    groups,
    createdAt,
  }
}

describe('personal food rows', () => {
  it('ranks by how often, then by how recently', () => {
    const rows = personalRows(
      [
        entry('Sulu köfte', '2026-08-01T19:00:00.000Z'),
        entry('Sulu köfte', '2026-08-02T19:00:00.000Z'),
        entry('Yoğurt', '2026-08-10T19:00:00.000Z'),
        entry('Karnıyarık', '2026-08-03T19:00:00.000Z'),
      ],
      'aksam',
      6,
    )

    expect(rows.map((row) => row.name)).toEqual(['Sulu köfte', 'Yoğurt', 'Karnıyarık'])
  })

  it('keeps to the meal it was asked about', () => {
    const rows = personalRows(
      [
        entry('Yumurta', '2026-08-01T08:00:00.000Z', 'kahvalti'),
        entry('Sulu köfte', '2026-08-01T19:00:00.000Z', 'aksam'),
      ],
      'kahvalti',
      6,
    )

    expect(rows.map((row) => row.name)).toEqual(['Yumurta'])
  })

  it('skips entries that carry no food group', () => {
    const rows = personalRows([entry('Bilinmeyen', '2026-08-01T19:00:00.000Z', 'aksam', [])], 'aksam', 6)

    expect(rows).toEqual([])
  })

  it('carries catalogue metadata for a food the catalogue knows', () => {
    const [row] = personalRows([entry('Yoğurt', '2026-08-01T19:00:00.000Z')], 'aksam', 6)

    expect(row.origin).toBe('catalog')
    expect(row.gramPerMeasure).toBeGreaterThan(0)
  })

  it('fills the empty slots from the written list without repeating history', () => {
    const rows = personalFoodRows([entry('Yoğurt', '2026-08-01T19:00:00.000Z')], 'aksam', 6)

    expect(rows).toHaveLength(6)
    expect(rows[0].name).toBe('Yoğurt')
    expect(rows.filter((row) => row.name === 'Yoğurt')).toHaveLength(1)
  })

  it('falls back to the written list entirely for a new account', () => {
    expect(personalFoodRows([], 'kahvalti', 6)).toHaveLength(6)
  })
})
