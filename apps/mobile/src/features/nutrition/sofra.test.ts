import { describe, expect, it } from 'vitest'
import { isSofraSaveable, sofraSummary, sofrasForMeal, type Sofra } from './sofra'

const sofra = (over: Partial<Sofra> = {}): Sofra => ({
  id: 's1',
  name: 'Sabah sofram',
  meals: ['kahvalti'],
  foods: [
    { name: 'Beyaz peynir', groups: ['sut'], measure: 'dilim', quantity: 2 },
    { name: 'Zeytin', groups: ['yag'], measure: 'adet', quantity: 5 },
  ],
  ...over,
})

describe('sofrasForMeal', () => {
  it('offers a sofra at the meals it was placed at', () => {
    expect(sofrasForMeal([sofra()], 'kahvalti')).toHaveLength(1)
    expect(sofrasForMeal([sofra()], 'aksam')).toHaveLength(0)
  })

  /* No meals is "I did not say", not "nowhere". Hiding those would make them
     saveable and unreachable, which is the worst of both. */
  it('offers a sofra with no meals everywhere', () => {
    const anywhere = sofra({ meals: [] })
    for (const meal of ['kahvalti', 'ogle', 'aksam', 'ara'] as const) {
      expect(sofrasForMeal([anywhere], meal)).toHaveLength(1)
    }
  })

  // The flow can reach the search step without a meal; narrowing on a meal
  // nobody has chosen would be a guess presented as a filter.
  it('offers everything when the meal is not known yet', () => {
    expect(sofrasForMeal([sofra(), sofra({ id: 's2', meals: ['aksam'] })], null)).toHaveLength(2)
  })

  it('keeps several meals on one sofra', () => {
    const both = sofra({ meals: ['ogle', 'aksam'] })
    expect(sofrasForMeal([both], 'ogle')).toHaveLength(1)
    expect(sofrasForMeal([both], 'aksam')).toHaveLength(1)
    expect(sofrasForMeal([both], 'kahvalti')).toHaveLength(0)
  })
})

describe('isSofraSaveable', () => {
  it('needs a name and something on the table', () => {
    expect(isSofraSaveable({ name: 'Sabah', meals: [], foods: sofra().foods })).toBe(true)
    expect(isSofraSaveable({ name: '', meals: [], foods: sofra().foods })).toBe(false)
    expect(isSofraSaveable({ name: '   ', meals: [], foods: sofra().foods })).toBe(false)
    expect(isSofraSaveable({ name: 'Sabah', meals: [], foods: [] })).toBe(false)
  })

  // Meals are optional by design: the sheet says so and the filter above
  // reads an empty list as "every meal".
  it('does not require a meal', () => {
    expect(isSofraSaveable({ name: 'Sabah', meals: [], foods: sofra().foods })).toBe(true)
  })
})

describe('sofraSummary', () => {
  it('lists the foods it can and counts the rest', () => {
    expect(sofraSummary(sofra())).toBe('Beyaz peynir · Zeytin')
    const long = sofra({
      foods: [...sofra().foods, ...sofra().foods].map((food, i) => ({ ...food, name: `B${String(i)}` })),
    })
    expect(sofraSummary(long, 2)).toBe('B0 · B1 +2')
  })
})
