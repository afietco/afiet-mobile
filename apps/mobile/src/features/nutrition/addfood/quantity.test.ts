import { describe, expect, it } from 'vitest'
import { convertQuantity, nudgeQuantity, quantityRange } from './quantity'

describe('quantity ranges', () => {
  it('counts servings in halves and grams in tens', () => {
    expect(quantityRange('porsiyon')).toEqual({ min: 0.5, max: 12, step: 0.5 })
    expect(quantityRange('gram')).toEqual({ min: 5, max: 1000, step: 10 })
  })

  it('steps within the bounds of its own measure', () => {
    expect(nudgeQuantity(1, 'porsiyon', 1)).toBe(1.5)
    expect(nudgeQuantity(0.5, 'porsiyon', -1)).toBe(0.5)
    expect(nudgeQuantity(250, 'gram', 1)).toBe(260)
    expect(nudgeQuantity(1000, 'gram', 1)).toBe(1000)
  })

  it('keeps 0.5 steps free of floating point drift', () => {
    expect(nudgeQuantity(1.5, 'porsiyon', -1)).toBe(1)
  })
})

describe('measure switching', () => {
  it('carries the same amount of food across the switch', () => {
    // Beyaz peynir: 1 dilim = 30 g.
    expect(convertQuantity(2, 'dilim', 'gram', 30)).toBe(60)
    expect(convertQuantity(60, 'gram', 'dilim', 30)).toBe(2)
  })

  it('clamps a conversion that lands outside the target range', () => {
    expect(convertQuantity(1, 'dilim', 'gram', 1)).toBe(5)
    expect(convertQuantity(12, 'porsiyon', 'gram', 250)).toBe(1000)
  })

  it('leaves the number alone when no gram weight is known', () => {
    expect(convertQuantity(2, 'porsiyon', 'gram')).toBe(5)
    expect(convertQuantity(2, 'porsiyon', 'porsiyon')).toBe(2)
  })
})
