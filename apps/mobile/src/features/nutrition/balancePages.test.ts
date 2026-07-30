import type { MealEntry } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import { groupsOf, mealSections } from './balancePages'

const entry = (over: Partial<MealEntry> = {}): MealEntry =>
  ({
    id: 1,
    profileId: 1,
    date: '2026-07-31',
    meal: 'kahvalti',
    foodName: 'Yumurta',
    quantity: 1,
    measure: 'adet',
    groups: ['protein'],
    createdAt: '2026-07-31T08:00:00.000Z',
    ...over,
  }) as MealEntry

describe('mealSections', () => {
  it('keeps the day in meal order rather than in logging order', () => {
    const sections = mealSections([
      entry({ id: 1, meal: 'aksam' }),
      entry({ id: 2, meal: 'kahvalti' }),
    ])
    expect(sections.map((section) => section.meal)).toEqual(['kahvalti', 'aksam'])
  })

  // An empty meal is not a gap to point at on this page: the page reads what
  // the day was, and Afi's note is where an unlogged meal gets mentioned.
  it('leaves out meals with nothing in them', () => {
    const sections = mealSections([entry({ meal: 'ogle' })])
    expect(sections).toHaveLength(1)
    expect(sections[0]?.meal).toBe('ogle')
  })

  it('gathers every entry of a meal under it', () => {
    const sections = mealSections([
      entry({ id: 1, meal: 'kahvalti', foodName: 'Yumurta' }),
      entry({ id: 2, meal: 'kahvalti', foodName: 'Zeytin' }),
    ])
    expect(sections[0]?.entries.map((e) => e.foodName)).toEqual(['Yumurta', 'Zeytin'])
  })

  it('has nothing to show for an empty day', () => {
    expect(mealSections([])).toEqual([])
  })
})

describe('groupsOf', () => {
  // The row of icons beside a meal says which groups came to the table, not
  // how many times each did: a second yoghurt must not draw a second icon.
  it('names each group once however many foods carried it', () => {
    expect(
      groupsOf([
        entry({ id: 1, groups: ['protein', 'sut'] }),
        entry({ id: 2, groups: ['sut', 'tahil'] }),
      ]),
    ).toEqual(['protein', 'sut', 'tahil'])
  })

  it('is empty when nothing carried a group', () => {
    expect(groupsOf([entry({ groups: [] })])).toEqual([])
  })
})
