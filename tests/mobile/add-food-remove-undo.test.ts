import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('meal entry removal', () => {
  it('provides a full-size target and a recoverable undo action', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('h-11 w-11 items-center justify-center')
    expect(source).toContain("undoingRemove ? 'Geri alınıyor…' : 'Geri al'")
    expect(source).toContain('await mealRepo.add(createRestoredMealEntry(entry))')
    expect(source).toContain('offerRemoveUndo(entry)')
  })
})
