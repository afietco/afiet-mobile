import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('macro progress brand language', () => {
  it('presents energy as approximate information without a target ratio', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/MacroProgressCard.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('Enerji ve Makro Dengesi')
    expect(source).toContain('Yaklaşık {num0.format(Math.round(totals.kcal))} kcal')
    expect(source).not.toContain('{num0.format(Math.round(target))} kcal')
  })
})
