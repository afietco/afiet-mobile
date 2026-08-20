import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('widget meal selection', () => {
  it('opens the sheet without a preset and asks for a meal before it saves', async () => {
    const todaySource = await readFile(
      new URL('../../apps/mobile/src/app/(tabs)/index.tsx', import.meta.url),
      'utf8',
    )
    const sheetSource = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(todaySource).toContain('setRequiresMealSelection(request.requiresMealSelection)')
    expect(todaySource).toContain('requireMealSelection={requiresMealSelection}')
    /* The save is no longer refused by a disabled button, which said nothing
       about which of the three answers was missing. It names this one. */
    expect(sheetSource).toContain("if (!mealSelectionConfirmed) return { message: 'Önce hangi öğün olduğunu seç.' }")
    expect(sheetSource).toContain('Kaydın doğru yere düşmesi için öğününü seç.')
    expect(sheetSource).toContain('onPress={() => chooseMeal(m.key)}')
  })
})
