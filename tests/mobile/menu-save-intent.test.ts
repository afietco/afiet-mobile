import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const addFoodSheet = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
  'utf8',
)
const customFoodSheet = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/CustomFoodSheet.tsx', import.meta.url),
  'utf8',
)
const repositoryContract = readFileSync(
  new URL('../../packages/core/src/repositories.ts', import.meta.url),
  'utf8',
)

describe('menu save intent', () => {
  it('does not write menu records while saving a meal entry', () => {
    expect(addFoodSheet).not.toContain('foodRepo.learn')
    expect(repositoryContract).not.toMatch(/\blearn\s*\(/)
  })

  it('keeps menu persistence behind the explicit bookmark flow', () => {
    expect(addFoodSheet).toContain('accessibilityLabel="Besini menüne kaydet"')
    expect(addFoodSheet).toContain('onPress={() => setDefining(true)}')
    expect(addFoodSheet).toContain('<CustomFoodSheet')
    expect(customFoodSheet).toContain('await foodRepo.saveCustom(food)')
  })
})
