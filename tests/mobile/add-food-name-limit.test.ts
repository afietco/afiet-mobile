import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('meal entry name layout', () => {
  it('limits typed food names and truncates suggestion labels to one line', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('const FOOD_NAME_MAX_LENGTH = 80')
    expect(source).toMatch(
      /<BottomSheetTextInput[\s\S]*?maxLength=\{FOOD_NAME_MAX_LENGTH\}[\s\S]*?numberOfLines=\{1\}/,
    )
    expect(source).toMatch(
      /<AppText numberOfLines=\{1\} className="min-w-0 flex-1 text-sm text-ink">\s*\{s\.name\}/,
    )
    expect(source).toContain('className="shrink-0 flex-row items-center gap-1"')
  })
})
