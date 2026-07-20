import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('widget meal selection', () => {
  it('opens the sheet without a preset and blocks saving until the user chooses', async () => {
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
    expect(sheetSource).toContain('const canSave = mealSelectionConfirmed && canSaveMealEntry')
    expect(sheetSource).toContain('Kaydın doğru yere düşmesi için öğününü seç.')
    expect(sheetSource).toContain('onPress={() => chooseMeal(m.key)}')
  })
})
