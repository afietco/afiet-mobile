import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SEED_FOODS, filterSeedFoods, normalizeFoodSearch, searchSeedFoods } from '../src/foods'
import { turkishLower } from '../src/turkish'

describe('food search', () => {
  it('does not let a crowded prefix starve the foods that answer the query', () => {
    /* About fifty foods contain "peynir", but only a handful start with the
       word. Ranked purely by prefix those few filled every slot, so the actual
       cheeses could never be reached however many letters were typed. */
    const names = searchSeedFoods('peynir', 8).map((food) => food.name)

    expect(names).toContain('Beyaz peynir')
    expect(names).toContain('Kaşar peyniri')
    // The prefix matches are still there, and still lead.
    expect(names[0]?.startsWith('Peynir')).toBe(true)
    expect(names.filter((name) => name.startsWith('Peynir')).length).toBeLessThanOrEqual(4)
  })

  it('keeps every match when they all fit', () => {
    const few = searchSeedFoods('peynir', 100)
    expect(few.length).toBeGreaterThan(20)
    // Nothing is dropped or duplicated once there is room for the whole set.
    expect(new Set(few.map((food) => food.name)).size).toBe(few.length)
  })

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
    /* Identity, not deep equality: `toContain` compares structurally against
       every element it walks, and over a 2000 food catalogue that turned a
       reachability check into the slowest test in the suite, slow enough to
       time out under parallel load. The claim was always "this exact food is
       in the result", which is what a reference comparison says. */
    for (const food of SEED_FOODS) {
      for (const alias of food.aliases) {
        const reached = filterSeedFoods(alias).some((candidate) => candidate === food)
        expect(reached, `${food.name}: ${alias}`).toBe(true)
      }
    }
  }, 120_000)

  it('provides stable unique identities for virtualized guide rows', () => {
    const keys = SEED_FOODS.map((food) => `${food.category}:${food.name}`)

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('handles uppercase dotted I without ICU', () => {
    expect(turkishLower('İSİM')).toBe('isim')
  })

  it('builds the search index on first use, never while the module loads', async () => {
    /* Indexing the catalogue normalizes every name and every alias: about four
       thousand string folds and two thousand more objects. At module scope all
       of that lands on app launch, before anything is on screen, for a screen
       most sessions never reach. */
    const path = fileURLToPath(new URL('../src/foods.ts', import.meta.url))
    const source = await readFile(path, 'utf8')

    expect(source).toContain('let searchIndex: FoodSearchEntry[] | null = null')
    expect(source).not.toMatch(/^const FOOD_SEARCH_INDEX/m)
    // Browsing the whole catalogue must not build an index it never consults.
    expect(filterSeedFoods('')).toBe(SEED_FOODS)
  })

  it('uses the shared username normalizer in UsernameSheet', async () => {
    const path = fileURLToPath(
      new URL('../../../apps/mobile/src/features/profile/UsernameSheet.tsx', import.meta.url),
    )
    const source = await readFile(path, 'utf8')

    expect(source).toContain("import { normalizeUsername } from '@/features/profile/username'")
    expect(source).toContain('setValue(normalizeUsername(raw))')
  })
})
