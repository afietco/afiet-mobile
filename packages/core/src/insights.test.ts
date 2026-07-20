import { afterEach, describe, expect, it, vi } from 'vitest'
import { calcStreak, dayBalance, dayMessage } from './insights'
import type { FoodGroup, MealEntry } from './types'

function mealEntry(groups: FoodGroup[]): MealEntry {
  return {
    profileId: 1,
    date: '2026-07-20',
    meal: 'ogle',
    foodName: 'Test food',
    quantity: 1,
    groups,
    createdAt: '2026-07-20T12:00:00.000Z',
  }
}

afterEach(() => vi.useRealTimers())

describe('nutrition insights', () => {
  it('counts unique core groups and indulgent entries', () => {
    const balance = dayBalance([
      mealEntry(['sebze', 'protein', 'tatli']),
      mealEntry(['protein', 'tahil', 'fastfood']),
      mealEntry(['tatli']),
    ])

    expect(balance.covered).toEqual(['sebze', 'protein', 'tahil'])
    expect(balance.missing).toEqual(['meyve', 'sut'])
    expect(balance.score).toBe(3)
    expect(balance.sweetCount).toBe(2)
    expect(balance.fastfoodCount).toBe(1)
  })

  it('selects messages for empty, balanced, and indulgent days', () => {
    expect(dayMessage(dayBalance([]), 0)).toContain('henüz kayıt yok')
    expect(
      dayMessage(dayBalance([mealEntry(['sebze', 'meyve', 'protein', 'tahil', 'sut'])]), 1),
    ).toContain('5 temel')
    expect(dayMessage(dayBalance([mealEntry(['tatli']), mealEntry(['fastfood'])]), 2)).toContain(
      'tatlı/fast food',
    )
  })

  it('calculates streaks from today or yesterday and stops at gaps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 20, 12))

    expect(calcStreak(['2026-07-20', '2026-07-19', '2026-07-18'])).toBe(3)
    expect(calcStreak(['2026-07-19', '2026-07-18'])).toBe(2)
    expect(calcStreak(['2026-07-20', '2026-07-18'])).toBe(1)
    expect(calcStreak([])).toBe(0)
  })
})
