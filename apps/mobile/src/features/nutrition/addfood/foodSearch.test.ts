import type { CustomFood } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import { buildFoodSearchRows, FOOD_SEARCH_LIMIT } from './foodSearch'

const NO_MENU: CustomFood[] = []

let nextId = 1
const menuFood = (name: string): CustomFood => ({
  id: nextId++,
  name,
  groups: ['protein'],
  measure: 'porsiyon',
})

describe('add-food search rows', () => {
  /**
   * The rows the step actually draws, not the catalogue helper behind them.
   *
   * The catalogue helper was returning a balanced list all along; the step
   * asked it for three times what it draws and then cut at eight, and the cut
   * fell entirely inside the leading tier. So "peynir" listed eight pastries
   * made with cheese and not one cheese, which is exactly the thing someone
   * typing "peynir" is looking for.
   */
  it('surfaces the foods that answer the query, not only the ones that start with it', () => {
    const names = buildFoodSearchRows('peynir', NO_MENU).map((row) => row.name)

    expect(names).toContain('Beyaz peynir')
    expect(names).toContain('Kaşar peyniri')
    // The prefix matches are not evicted either: they still lead the list.
    expect(names[0]?.startsWith('Peynir')).toBe(true)
    expect(names.length).toBe(FOOD_SEARCH_LIMIT)
  })

  it('finds a food by a word in the middle of its name', () => {
    /* Matching has always been "contains" rather than "starts with"; this
       pins it, because the visible symptom of the ranking bug looked exactly
       like a prefix-only search. */
    const names = buildFoodSearchRows('mercimek', NO_MENU).map((row) => row.name)

    expect(names.some((name) => !name.toLocaleLowerCase('tr').startsWith('mercimek'))).toBe(true)
  })

  it('leads with the exact match and marks it', () => {
    const rows = buildFoodSearchRows('beyaz peynir', NO_MENU)

    expect(rows[0]?.name).toBe('Beyaz peynir')
    expect(rows[0]?.exact).toBe(true)
  })

  it("puts the person's own menu above the catalogue", () => {
    const rows = buildFoodSearchRows('peynir', [menuFood('Annemin peyniri')])

    expect(rows[0]?.name).toBe('Annemin peyniri')
    expect(rows[0]?.origin).toBe('menu')
    // The catalogue still fills the rest of the list rather than being crowded out.
    expect(rows.map((row) => row.name)).toContain('Beyaz peynir')
  })

  it('never lists the same food twice', () => {
    const rows = buildFoodSearchRows('peynir', [menuFood('Beyaz peynir')])
    const names = rows.map((row) => row.name.toLocaleLowerCase('tr'))

    expect(new Set(names).size).toBe(names.length)
  })

  it('answers an empty query with nothing', () => {
    expect(buildFoodSearchRows('   ', NO_MENU)).toEqual([])
  })
})
