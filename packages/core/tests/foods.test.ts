import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SEED_FOODS, filterSeedFoods, normalizeFoodSearch, searchSeedFoods } from '../src/foods'
import { turkishLower } from '../src/turkish'

describe('food search', () => {
  it('folds Turkish accents and dotted letters', () => {
    expect(normalizeFoodSearch('İÇLİ KÖFTE')).toBe('icli kofte')
    expect(normalizeFoodSearch('Poğaça')).toBe('pogaca')
    expect(searchSeedFoods('pogaca').some((food) => food.name === 'Poğaça')).toBe(true)
  })

  it('includes aliases in guide results', () => {
    expect(filterSeedFoods('gevrek').some((food) => food.name === 'Simit')).toBe(true)
  })

  it('keeps every accented food reachable with its folded name', () => {
    const accentedFoods = SEED_FOODS.filter(
      (food) => normalizeFoodSearch(food.name) !== turkishLower(food.name.trim()),
    )

    expect(accentedFoods.length).toBeGreaterThan(0)
    for (const food of accentedFoods) {
      expect(filterSeedFoods(normalizeFoodSearch(food.name)), food.name).toContain(food)
    }
  })

  it('keeps every food reachable through each configured alias', () => {
    for (const food of SEED_FOODS) {
      for (const alias of food.aliases) {
        expect(filterSeedFoods(alias), `${food.name}: ${alias}`).toContain(food)
      }
    }
  })

  it('provides stable unique identities for virtualized guide rows', () => {
    const keys = SEED_FOODS.map((food) => `${food.category}:${food.name}`)

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('handles uppercase dotted I without ICU', () => {
    expect(turkishLower('İSİM')).toBe('isim')
  })

  it('uses the Turkish lowercase helper in UsernameSheet', async () => {
    const path = fileURLToPath(
      new URL('../../../apps/mobile/src/features/profile/UsernameSheet.tsx', import.meta.url),
    )
    const source = await readFile(path, 'utf8')

    expect(source).toMatch(/import \{ turkishLower \} from '@afiet\/core'/)
    expect(source).toMatch(/setValue\(turkishLower\(raw\.replace/)
  })
})
