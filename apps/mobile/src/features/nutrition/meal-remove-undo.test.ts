import type { MealEntry } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import { createRestoredMealEntry } from './meal-remove-undo'

describe('createRestoredMealEntry', () => {
  it('preserves every editable field while dropping the deleted identifier', () => {
    const removed: MealEntry = {
      id: 42,
      profileId: 1,
      date: '2026-07-20',
      meal: 'ogle',
      foodName: 'Mercimek çorbası',
      quantity: 1.5,
      measure: 'kase',
      groups: ['bakliyat'],
      note: 'Limonlu',
      createdAt: '2026-07-20T12:00:00Z',
    }

    expect(createRestoredMealEntry(removed)).toEqual({
      profileId: 1,
      date: '2026-07-20',
      meal: 'ogle',
      foodName: 'Mercimek çorbası',
      portionSize: undefined,
      quantity: 1.5,
      measure: 'kase',
      groups: ['bakliyat'],
      note: 'Limonlu',
      createdAt: '2026-07-20T12:00:00Z',
    })
  })
})
