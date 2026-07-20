import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { resolveMealEntryDate } from '../../apps/mobile/src/features/nutrition/mealEntryDate'

const addFoodSheet = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
  'utf8',
)

describe('meal entry date freshness', () => {
  it('uses the current local day on each new meal save', () => {
    const beforeMidnight = new Date(2026, 6, 20, 23, 59)
    const afterMidnight = new Date(2026, 6, 21, 0, 1)

    expect(resolveMealEntryDate(undefined, beforeMidnight)).toBe('2026-07-20')
    expect(resolveMealEntryDate(undefined, afterMidnight)).toBe('2026-07-21')
    expect(addFoodSheet).toContain('const saveDate = resolveMealEntryDate(initialEntry?.date)')
    expect(addFoodSheet).toContain('date: saveDate')
  })

  it('keeps the original day while editing a historical meal', () => {
    expect(resolveMealEntryDate('2026-06-12', new Date(2026, 6, 21, 0, 1))).toBe('2026-06-12')
  })

  it('refreshes the active date after returning from the background', () => {
    expect(addFoodSheet).toContain("AppState.addEventListener('change'")
    expect(addFoodSheet).toContain("if (state === 'active') setEntryDate(resolveMealEntryDate())")
    expect(addFoodSheet).toContain('mealRepo.forDay(profileId, entryDate)')
    expect(addFoodSheet).toContain('date={entryDate}')
  })
})
