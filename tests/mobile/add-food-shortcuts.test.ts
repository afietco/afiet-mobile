import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('meal logging shortcuts', () => {
  it('renders recent foods and yesterday repeat from one range query', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('mealRepo.forRange(')
    expect(source).toContain('Son eklenenler')
    expect(source).toContain('Dünkü öğünü tekrarla')
    expect(source).toContain('repeatMealEntries(mealRepo, sourceEntries')
  })
})
