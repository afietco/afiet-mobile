import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('meal entry picker', () => {
  it('keeps meal chips editable when the sheet opens with a preset meal', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(source).not.toContain('{meal === null && (')
    expect(source).toContain('onPress={() => chooseMeal(m.key)}')
    expect(source).toContain('`${mealMeta(selectedMeal).label} — Besin Ekle`')
    expect(source).toContain('meal: selectedMeal')
  })
})
