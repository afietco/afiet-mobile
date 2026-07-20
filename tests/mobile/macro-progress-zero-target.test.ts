import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { progressPercent } from '../../apps/mobile/src/features/nutrition/macroProgress'

describe('macro progress zero targets', () => {
  it('keeps bar widths finite and presents a neutral reference state', async () => {
    expect(progressPercent(120, 0)).toBe(0)
    expect(progressPercent(120, Number.NaN)).toBe(0)
    expect(progressPercent(120, 240)).toBe(50)

    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/MacroProgressCard.tsx', import.meta.url),
      'utf8',
    )
    expect(source).toContain('const pct = progressPercent(value, max)')
    expect(source).toContain('Enerji referansı hazırlanıyor.')
    expect(source).toContain('Referans hazırlanıyor')
  })
})
