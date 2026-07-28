import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { progressPercent } from '../../apps/mobile/src/features/nutrition/macroProgress'

describe('macro progress zero targets', () => {
  it('keeps bar widths finite when there is no target behind them', async () => {
    expect(progressPercent(120, 0)).toBe(0)
    expect(progressPercent(120, Number.NaN)).toBe(0)
    expect(progressPercent(120, 240)).toBe(50)

    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/MacroProgressCard.tsx', import.meta.url),
      'utf8',
    )
    expect(source).toContain('const pct = progressPercent(value, max)')
    /* A missing target used to be announced ("Referans hazırlanıyor"). It is no
       longer a state the card can be in for long, so the row keeps what was
       eaten and simply drops the "/ target" half of the label. The neutral copy
       is guarded in macro-progress-brand-language.test.ts. */
    expect(source).toContain("{targetAvailable ? ` / ${macro.text} g` : ' g'}")
  })
})
