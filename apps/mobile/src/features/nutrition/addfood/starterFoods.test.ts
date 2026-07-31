import { MEAL_TYPES, type MealType } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import { starterRows } from './starterFoods'

describe('starterRows', () => {
  /**
   * The reason this file exists.
   *
   * Starters are written as names and resolved against the catalogue, and the
   * catalogue is editable from the admin panel: a rename silently empties the
   * list this is meant to fill, which would put the empty add-food step back
   * exactly as it was. A short count here is a failing test, not a quiet
   * regression on someone's first day in the app.
   */
  it('resolves a full set for every meal', () => {
    for (const meal of MEAL_TYPES) {
      const rows = starterRows(meal.key)
      expect(rows, `${meal.key} için başlangıç önerisi eksik`).toHaveLength(6)
    }
  })

  it('carries the groups a row needs to resolve a draft in one tap', () => {
    for (const row of starterRows('kahvalti')) {
      expect(row.groups.length, `${row.name} grupsuz geldi`).toBeGreaterThan(0)
      expect(row.origin).toBe('catalog')
      expect(row.exact).toBe(false)
    }
  })

  it('offers different foods for breakfast than for dinner', () => {
    const breakfast = starterRows('kahvalti').map((row) => row.name)
    const dinner = starterRows('aksam').map((row) => row.name)
    expect(breakfast).not.toEqual(dinner)
  })

  // The flow can reach the search step with no meal when it was opened from a
  // link that named none. Falling through to nothing would be the old bug.
  it('still offers something when no meal is chosen', () => {
    expect(starterRows(null).length).toBeGreaterThan(0)
  })

  it('honours the limit', () => {
    expect(starterRows('ogle' as MealType, 3)).toHaveLength(3)
  })
})
