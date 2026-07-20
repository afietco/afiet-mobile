import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('meal entry name focus', () => {
  it('focuses normal openings and waits for meal selection on invalid deep links', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toMatch(
      /<BottomSheetTextInput\s+ref={inputRef}\s+autoFocus={!requireMealSelection}/,
    )
    expect(source).toContain('if (open && !requireMealSelection) inputRef.current?.focus()')
    expect(source).toContain('inputRef.current?.focus()')
  })
})
