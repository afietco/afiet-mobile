import type { MealEntry } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import { repeatedFoods, sofraDraftFromRepeats } from './repeats'

function entry(overrides: Partial<MealEntry> & Pick<MealEntry, 'foodName' | 'date'>): MealEntry {
  return {
    profileId: 1,
    meal: 'kahvalti',
    quantity: 1,
    groups: ['tahil'],
    createdAt: `${overrides.date}T08:00:00.000Z`,
    ...overrides,
  }
}

describe('repeated foods', () => {
  it('needs the same food on two different days, not twice in one', () => {
    const sameDay = [entry({ foodName: 'Çay', date: '2026-08-10' }), entry({ foodName: 'Çay', date: '2026-08-10' })]
    expect(repeatedFoods(sameDay)).toEqual([])

    const twoDays = [entry({ foodName: 'Çay', date: '2026-08-10' }), entry({ foodName: 'çay', date: '2026-08-11' })]
    expect(repeatedFoods(twoDays)).toHaveLength(1)
  })

  it('reads a name the Turkish way and keeps the latest spelling', () => {
    const entries = [
      entry({ foodName: 'SİMİT', date: '2026-08-10' }),
      entry({ foodName: 'Simit', date: '2026-08-12', createdAt: '2026-08-12T09:00:00.000Z' }),
    ]
    expect(repeatedFoods(entries)[0]?.name).toBe('Simit')
  })

  it('skips entries with no food group: they cannot move a balance', () => {
    const entries = [
      entry({ foodName: 'Su', date: '2026-08-10', groups: [] }),
      entry({ foodName: 'Su', date: '2026-08-11', groups: [] }),
    ]
    expect(repeatedFoods(entries)).toEqual([])
  })

  it('names the meal the habit belongs to most often', () => {
    const entries = [
      entry({ foodName: 'Yoğurt', date: '2026-08-10', meal: 'aksam' }),
      entry({ foodName: 'Yoğurt', date: '2026-08-11', meal: 'aksam' }),
      entry({ foodName: 'Yoğurt', date: '2026-08-12', meal: 'kahvalti' }),
    ]
    const [repeat] = repeatedFoods(entries)
    expect(repeat?.meal).toBe('aksam')
    expect(repeat?.days).toBe(3)
  })
})

describe('the offered sofra', () => {
  it('is built from the strongest habit and everything repeated at that meal', () => {
    const entries = [
      entry({ foodName: 'Peynir', date: '2026-08-10' }),
      entry({ foodName: 'Peynir', date: '2026-08-11' }),
      entry({ foodName: 'Peynir', date: '2026-08-12' }),
      entry({ foodName: 'Zeytin', date: '2026-08-10' }),
      entry({ foodName: 'Zeytin', date: '2026-08-12' }),
      entry({ foodName: 'Mercimek çorbası', date: '2026-08-10', meal: 'aksam' }),
      entry({ foodName: 'Mercimek çorbası', date: '2026-08-11', meal: 'aksam' }),
    ]
    const draft = sofraDraftFromRepeats(repeatedFoods(entries))
    expect(draft?.name).toBe('Kahvaltı sofram')
    expect(draft?.meals).toEqual(['kahvalti'])
    expect(draft?.foods.map((food) => food.name)).toEqual(['Peynir', 'Zeytin'])
  })

  it('offers nothing when nothing repeats', () => {
    expect(sofraDraftFromRepeats([])).toBe(null)
  })
})
