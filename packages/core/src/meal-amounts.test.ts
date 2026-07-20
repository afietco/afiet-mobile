import { describe, expect, it } from 'vitest'
import { formatMealAmount } from './meal-amounts'

describe('formatMealAmount', () => {
  it('formats decimal quantities with the localized measurement label', () => {
    expect(formatMealAmount({ quantity: 1.5, measure: 'kase' })).toBe('1,5 kase')
  })

  it('uses portions for legacy entries without a measurement', () => {
    expect(formatMealAmount({ quantity: 2 })).toBe('2 porsiyon')
  })
})
