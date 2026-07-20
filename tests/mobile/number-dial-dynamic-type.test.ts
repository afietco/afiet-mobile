import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('number dial dynamic type', () => {
  it('allows the value field to grow beyond its base height', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/ui/inputs/NumberDial.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('minHeight: 56')
    expect(source).not.toContain('height: 56')
  })
})
