import { readFileSync } from 'node:fs'
import type { CustomFood } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import {
  buildFoodSearchRows,
  buildMenuRows,
  MENU_PREVIEW_LIMIT,
} from '../../apps/mobile/src/features/nutrition/addfood/foodSearch'

const step = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/FoodSearchStep.tsx', import.meta.url),
  'utf8',
)

const menuFood = (name: string, groups: CustomFood['groups'] = ['sebze']): CustomFood => ({
  name,
  groups,
})

describe('food search rows', () => {
  it('keeps a finished catalogue name in the results instead of dropping it', () => {
    const rows = buildFoodSearchRows('Elma', [])

    expect(rows.some((row) => row.name === 'Elma')).toBe(true)
  })

  it('leads with the exact match and marks it', () => {
    const rows = buildFoodSearchRows('elma', [])

    expect(rows[0].name).toBe('Elma')
    expect(rows[0].exact).toBe(true)
    expect(rows.filter((row) => row.exact)).toHaveLength(1)
  })

  it('lists the exact match once, not twice', () => {
    const rows = buildFoodSearchRows('elma', [])
    const elmaRows = rows.filter((row) => row.name === 'Elma')

    expect(elmaRows).toHaveLength(1)
  })

  it('de-duplicates by name across the menu and the catalogue', () => {
    const rows = buildFoodSearchRows('elma', [menuFood('Elma', ['meyve'])])
    const keys = rows.map((row) => row.key)

    expect(new Set(keys).size).toBe(keys.length)
    // The user's own entry wins: it carries their groups and measure.
    expect(rows[0].origin).toBe('menu')
    expect(rows[0].exact).toBe(true)
  })

  it('offers partial menu matches ahead of the catalogue', () => {
    const rows = buildFoodSearchRows('elma', [menuFood('Elmalı kek', ['hamurisi'])])

    expect(rows.some((row) => row.name === 'Elmalı kek' && row.origin === 'menu')).toBe(true)
  })

  it('resolves every row with a real origin, never null', () => {
    const rows = buildFoodSearchRows('yoğurt', [menuFood('Yoğurtlu makarna')])

    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(['catalog', 'menu']).toContain(row.origin)
      expect(row.groups.length).toBeGreaterThan(0)
    }
  })

  it('returns nothing for an empty query', () => {
    expect(buildFoodSearchRows('   ', [menuFood('Elma')])).toEqual([])
  })

  it('honours the row limit', () => {
    expect(buildFoodSearchRows('e', [], 4)).toHaveLength(4)
  })
})

describe('menu rows', () => {
  it('stays capped and alphabetical however large the menu grows', () => {
    const menu = ['Zeytinyağlı fasulye', 'Ayran', 'Çoban salata', 'Börek', 'Dolma', 'Ezogelin', 'Fırın makarna']
      .map((name) => menuFood(name))
    const rows = buildMenuRows(menu)

    expect(rows).toHaveLength(MENU_PREVIEW_LIMIT)
    expect(rows[0].name).toBe('Ayran')
    expect(rows.every((row) => row.origin === 'menu')).toBe(true)
  })
})

describe('food search step', () => {
  it('uses the sheet text input so the keyboard cannot cover it', () => {
    expect(step).toContain("import { BottomSheetTextInput } from '@gorhom/bottom-sheet'")
    expect(step).toContain('<BottomSheetTextInput')
    expect(step).not.toMatch(/<TextInput\b/)
  })

  it('reserves keyboard room on iOS only, where the sheet cannot lift further', () => {
    expect(step).toContain("Platform.OS === 'ios' && keyboardHeight > 0")
    expect(step).toContain('keyboardHeight - insets.bottom')
  })

  it('replaces the recent chip cloud with the saved menu', () => {
    expect(step).not.toContain('Son eklenenler')
    expect(step).toContain('Menümden seç')
    expect(step).toContain('buildMenuRows')
  })

  it('sends an unknown food to Afi and offers no manual metadata entry', () => {
    expect(step).toContain('listede yok')
    expect(step).toContain('onNeedPhoto()')
    expect(step).toContain('onNeedBookmark(trimmed)')
    expect(step).not.toContain('FOOD_GROUPS')
    expect(step).not.toContain('FOOD_MEASURES')
  })

  it('advances on selection without a confirm control', () => {
    expect(step).toContain('onAdvance()')
    expect(step).not.toContain('Kaydet')
    expect(step).not.toContain('Devam')
  })

  it('only ever writes an origin it resolved', () => {
    expect(step).toContain('origin: row.origin')
    // The single null write clears a stale resolution, it never creates one.
    expect(step.match(/origin: null/g) ?? []).toHaveLength(1)
  })
})
