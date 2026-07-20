import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH,
  CUSTOM_FOOD_NAME_MAX_LENGTH,
  limitCustomFoodDescription,
  limitCustomFoodName,
} from '../../apps/mobile/src/features/nutrition/customFoodLimits'

describe('custom food text limits', () => {
  it('limits typed and programmatic food values to safe lengths', async () => {
    expect(limitCustomFoodName('a'.repeat(CUSTOM_FOOD_NAME_MAX_LENGTH + 1))).toHaveLength(
      CUSTOM_FOOD_NAME_MAX_LENGTH,
    )
    expect(
      limitCustomFoodDescription('a'.repeat(CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH + 1)),
    ).toHaveLength(CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH)
    expect(
      Array.from(limitCustomFoodName('🍲'.repeat(CUSTOM_FOOD_NAME_MAX_LENGTH + 1))),
    ).toHaveLength(CUSTOM_FOOD_NAME_MAX_LENGTH)

    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/CustomFoodSheet.tsx', import.meta.url),
      'utf8',
    )
    expect(source).toContain('maxLength={CUSTOM_FOOD_NAME_MAX_LENGTH}')
    expect(source).toContain('maxLength={CUSTOM_FOOD_DESCRIPTION_MAX_LENGTH}')
    expect(source).toContain("setName(limitCustomFoodName(initial?.name ?? ''))")
    expect(source).toContain('limitCustomFoodDescription(food.description)')
  })
})
