import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { turkishUpper } from '../../packages/core/src/turkish'

describe('Turkish uppercase labels', () => {
  it('uppercases dotted and dotless i without locale support', () => {
    expect(turkishUpper('Protein')).toBe('PROTEİN')
    expect(turkishUpper('ışık')).toBe('IŞIK')
  })

  // The macro compass moved out of the /veri screen into the embeddable
  // NumbersPanel, which the Hedeflerim screen also hosts.
  it('precomputes numbers panel labels instead of using CSS uppercase', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/body/NumbersPanel.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('{turkishUpper(m.name)}')
    expect(source).not.toContain('className={`text-[9px] uppercase ${m.title}`}')
  })
})
