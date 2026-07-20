import { describe, expect, it } from 'vitest'
import { canSaveMealEntry } from './mealEntryValidation'

describe('canSaveMealEntry', () => {
  it('rejects an unknown food without a selected group', () => {
    expect(canSaveMealEntry('Ev yapımı börek', [])).toBe(false)
  })

  it('accepts an unknown food after a group is selected', () => {
    expect(canSaveMealEntry('Ev yapımı börek', ['tahil'])).toBe(true)
  })

  it('rejects a blank food name even when a group is selected', () => {
    expect(canSaveMealEntry('   ', ['tahil'])).toBe(false)
  })
})
