import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('meal entry name focus', () => {
  it('focuses the name input on both initial and repeated sheet openings', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toMatch(/<BottomSheetTextInput\s+ref={inputRef}\s+autoFocus/)
    expect(source).toMatch(/if \(open\) inputRef\.current\?\.focus\(\)/)
  })
})
