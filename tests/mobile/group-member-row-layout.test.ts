import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const groupHomePath = fileURLToPath(
  new URL('../../apps/mobile/src/features/groups/GroupHome.tsx', import.meta.url),
)

describe('group member row layout', () => {
  it('preserves readable identity width and wraps actions on narrow screens', async () => {
    const source = await readFile(groupHomePath, 'utf8')

    expect(source).toContain('flex-row flex-wrap items-center gap-x-3 gap-y-2 py-2.5')
    expect(source).toContain('min-w-40 flex-1 flex-row items-center gap-3')
    expect(source).toContain('<View className="min-w-24 flex-1">')
    expect(source).toContain(
      'ml-auto max-w-full shrink-0 flex-row flex-wrap items-center justify-end gap-2',
    )
  })
})
