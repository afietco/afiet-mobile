import type { MealEntry } from '@afiet/core'
import { describe, expect, it, vi } from 'vitest'
import { entriesForMeal, recentMealShortcuts, repeatMealEntries } from './meal-shortcuts'

function entry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: 1,
    profileId: 1,
    date: '2026-07-20',
    meal: 'ogle',
    foodName: 'Mercimek çorbası',
    quantity: 1,
    measure: 'kase',
    groups: ['bakliyat'],
    createdAt: '2026-07-20T12:00:00Z',
    ...overrides,
  }
}

describe('meal shortcuts', () => {
  it('keeps the latest usable entry for each normalized food name', () => {
    const older = entry({ id: 1, createdAt: '2026-07-18T12:00:00Z', quantity: 1 })
    const latest = entry({ id: 2, foodName: 'MERCİMEK ÇORBASI', quantity: 2 })
    const bread = entry({ id: 3, foodName: 'Ekmek', measure: 'dilim' })
    const unusable = entry({ id: 4, foodName: 'Tanımsız', groups: [] })

    expect(recentMealShortcuts([older, latest, bread, unusable])).toEqual([latest, bread])
  })

  it('selects only the requested meal and day', () => {
    const lunch = entry({ id: 1, date: '2026-07-19', meal: 'ogle' })
    const dinner = entry({ id: 2, date: '2026-07-19', meal: 'aksam' })

    expect(entriesForMeal([lunch, dinner], '2026-07-19', 'ogle')).toEqual([lunch])
  })

  it('copies every entry into the target meal', async () => {
    const add = vi.fn().mockResolvedValueOnce(11).mockResolvedValueOnce(12)
    const remove = vi.fn()

    await repeatMealEntries(
      { add, remove },
      [entry(), entry({ id: 2, foodName: 'Ekmek', measure: 'dilim' })],
      { profileId: 1, date: '2026-07-21', meal: 'aksam', createdAt: 'now' },
    )

    expect(add).toHaveBeenCalledTimes(2)
    expect(add).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: '2026-07-21', meal: 'aksam', foodName: 'Ekmek' }),
    )
    expect(remove).not.toHaveBeenCalled()
  })

  it('rolls back entries created before a later write fails', async () => {
    const failure = new Error('Network request failed')
    const add = vi.fn().mockResolvedValueOnce(11).mockRejectedValueOnce(failure)
    const remove = vi.fn().mockResolvedValue(undefined)

    await expect(
      repeatMealEntries(
        { add, remove },
        [entry(), entry({ id: 2, foodName: 'Ekmek' })],
        { profileId: 1, date: '2026-07-21', meal: 'ogle', createdAt: 'now' },
      ),
    ).rejects.toBe(failure)
    expect(remove).toHaveBeenCalledWith(11)
  })
})
