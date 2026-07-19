import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !specifier.match(/\.[a-z]+$/i)) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})

const { SEED_FOODS, filterSeedFoods, normalizeFoodSearch, searchSeedFoods } =
  await import('../src/foods.ts')
const { turkishLower } = await import('../src/turkish.ts')

test('food search folds Turkish accents and dotted letters', () => {
  assert.equal(normalizeFoodSearch('İÇLİ KÖFTE'), 'icli kofte')
  assert.equal(normalizeFoodSearch('Poğaça'), 'pogaca')
  assert.equal(searchSeedFoods('pogaca').some((food) => food.name === 'Poğaça'), true)
})

test('food guide search includes aliases', () => {
  assert.equal(filterSeedFoods('gevrek').some((food) => food.name === 'Simit'), true)
})

test('every accented food remains reachable with its folded name', () => {
  const accentedFoods = SEED_FOODS.filter(
    (food) => normalizeFoodSearch(food.name) !== turkishLower(food.name.trim()),
  )

  assert.ok(accentedFoods.length > 0)
  for (const food of accentedFoods) {
    assert.equal(filterSeedFoods(normalizeFoodSearch(food.name)).includes(food), true, food.name)
  }
})

test('every food remains reachable through each configured alias', () => {
  for (const food of SEED_FOODS) {
    for (const alias of food.aliases) {
      assert.equal(filterSeedFoods(alias).includes(food), true, `${food.name}: ${alias}`)
    }
  }
})

test('Turkish lowercase handles uppercase dotted I without ICU', () => {
  assert.equal(turkishLower('İSİM'), 'isim')
})

test('UsernameSheet uses the ICU-independent Turkish lowercase helper', async () => {
  const path = fileURLToPath(
    new URL('../../../apps/mobile/src/features/profile/UsernameSheet.tsx', import.meta.url),
  )
  const source = await readFile(path, 'utf8')

  assert.match(source, /import \{ turkishLower \} from '@afiet\/core'/)
  assert.match(source, /setValue\(turkishLower\(raw\.replace/)
})
