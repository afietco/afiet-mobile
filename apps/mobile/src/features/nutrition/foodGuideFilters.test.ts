import { FOOD_CATEGORIES, FOOD_GROUPS, SEED_FOODS } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import {
  EMPTY_FOOD_FILTER,
  categoryCounts,
  filterFoodGuide,
  groupCounts,
  isFiltering,
  toggleFilterValue,
} from './foodGuideFilters'

const filter = (over: Partial<typeof EMPTY_FOOD_FILTER> = {}) => ({
  ...EMPTY_FOOD_FILTER,
  ...over,
})

describe('filterFoodGuide', () => {
  it('is the whole catalogue when nothing is asked of it', () => {
    expect(filterFoodGuide(filter())).toHaveLength(SEED_FOODS.length)
  })

  // Within one kind the chips read as "either", which is what a row of
  // toggles looks like it means.
  it('treats several chips of the same kind as either', () => {
    const vegan = filterFoodGuide(filter({ dietTags: ['vegan'] }))
    const glutenFree = filterFoodGuide(filter({ dietTags: ['glutensiz'] }))
    const both = filterFoodGuide(filter({ dietTags: ['vegan', 'glutensiz'] }))
    expect(both.length).toBeGreaterThanOrEqual(Math.max(vegan.length, glutenFree.length))
  })

  // Across kinds they read as "both", which is the only reading that lets
  // someone actually narrow anything down.
  it('treats chips of different kinds as both', () => {
    const vegan = filterFoodGuide(filter({ dietTags: ['vegan'] }))
    const veganBreakfast = filterFoodGuide(filter({ dietTags: ['vegan'], meals: ['kahvalti'] }))
    expect(veganBreakfast.length).toBeLessThanOrEqual(vegan.length)
    for (const food of veganBreakfast) {
      expect(food.dietTags).toContain('vegan')
      expect(food.suitableMeals).toContain('kahvalti')
    }
  })

  /* Kind and group answer different questions: "çorba" is what a thing IS on
     the table, "sebze" is what it is made of, and a lentil soup answers both.
     Selecting one must not stand in for the other. */
  it('narrows by kind, separately from group', () => {
    const soups = filterFoodGuide(filter({ categories: ['corba'] }))
    expect(soups.length).toBeGreaterThan(0)
    for (const food of soups) expect(food.category).toBe('corba')

    const vegetableSoups = filterFoodGuide(filter({ categories: ['corba'], groups: ['sebze'] }))
    expect(vegetableSoups.length).toBeLessThanOrEqual(soups.length)
    for (const food of vegetableSoups) {
      expect(food.category).toBe('corba')
      expect(food.groups).toContain('sebze')
    }
  })

  it('treats several kinds as either', () => {
    const both = filterFoodGuide(filter({ categories: ['corba', 'tatli'] }))
    const soups = filterFoodGuide(filter({ categories: ['corba'] }))
    expect(both.length).toBeGreaterThan(soups.length)
    for (const food of both) expect(['corba', 'tatli']).toContain(food.category)
  })

  it('narrows by group', () => {
    for (const food of filterFoodGuide(filter({ groups: ['sebze'] }))) {
      expect(food.groups).toContain('sebze')
    }
  })

  it('combines free text with the chips', () => {
    const byText = filterFoodGuide(filter({ query: 'peynir' }))
    const narrowed = filterFoodGuide(filter({ query: 'peynir', groups: ['sut'] }))
    expect(narrowed.length).toBeLessThanOrEqual(byText.length)
    for (const food of narrowed) expect(food.groups).toContain('sut')
  })
})

describe('groupCounts', () => {
  /* Counted against the text only. Counting against the other chips would let
     one selection zero out its neighbours, and a chip reading "0" is a dead
     end rather than a map of what is in the catalogue. */
  it('does not let one chip zero out the others', () => {
    const keys = FOOD_GROUPS.map((group) => group.key)
    const counts = groupCounts('', keys)
    for (const key of keys) expect(counts.get(key)).toBeGreaterThan(0)
  })

  it('follows the text', () => {
    const keys = FOOD_GROUPS.map((group) => group.key)
    const all = groupCounts('', keys)
    const narrowed = groupCounts('peynir', keys)
    expect(narrowed.get('sut')).toBeLessThan(all.get('sut') ?? 0)
  })

  it('counts a food once per group however many times it carries it', () => {
    const counts = groupCounts('', ['sebze'])
    const bySearch = SEED_FOODS.filter((food) => food.groups.includes('sebze')).length
    expect(counts.get('sebze')).toBe(bySearch)
  })
})

describe('categoryCounts', () => {
  // Every food carries exactly one kind, so the counts partition the catalogue.
  it('adds up to the whole catalogue', () => {
    const keys = FOOD_CATEGORIES.map((category) => category.key)
    const counts = categoryCounts('', keys)
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0)
    expect(total).toBe(SEED_FOODS.length)
  })

  it('follows the text', () => {
    const keys = FOOD_CATEGORIES.map((category) => category.key)
    const narrowed = categoryCounts('çorba', keys)
    const total = [...narrowed.values()].reduce((sum, n) => sum + n, 0)
    expect(total).toBeGreaterThan(0)
    expect(total).toBeLessThan(SEED_FOODS.length)
  })
})

describe('toggleFilterValue', () => {
  it('adds what is missing and removes what is there', () => {
    expect(toggleFilterValue<string>([], 'vegan')).toEqual(['vegan'])
    expect(toggleFilterValue(['vegan'], 'vegan')).toEqual([])
  })
})

describe('isFiltering', () => {
  it('is false for the untouched guide', () => {
    expect(isFiltering(filter())).toBe(false)
  })

  it('is true for any single narrowing', () => {
    expect(isFiltering(filter({ query: 'a' }))).toBe(true)
    expect(isFiltering(filter({ categories: ['corba'] }))).toBe(true)
    expect(isFiltering(filter({ groups: ['sebze'] }))).toBe(true)
    expect(isFiltering(filter({ meals: ['ara'] }))).toBe(true)
    expect(isFiltering(filter({ dietTags: ['vegan'] }))).toBe(true)
  })

  // Whitespace is not a search: it must not put the guide into the state that
  // offers a "clear the filters" way out of nothing.
  it('ignores a field holding only spaces', () => {
    expect(isFiltering(filter({ query: '   ' }))).toBe(false)
  })
})
