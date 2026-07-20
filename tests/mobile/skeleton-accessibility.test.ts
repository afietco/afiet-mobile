import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('skeleton accessibility', () => {
  it('announces the loading state to screen readers', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/ui/Skeleton.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('accessible')
    expect(source).toContain('accessibilityRole="progressbar"')
    expect(source).toContain('accessibilityLabel="Yükleniyor"')
    expect(source).toContain('accessibilityState={{ busy: true }}')
  })
})
