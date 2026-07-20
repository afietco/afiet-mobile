import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const groupScreenPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/(tabs)/grubum.tsx', import.meta.url),
)

describe('group mutation refresh', () => {
  it('re-fetches the date-scoped group view after rename and member removal', async () => {
    const source = await readFile(groupScreenPath, 'utf8')

    expect(source).toMatch(
      /const refreshViewAfterMutation[\s\S]*applyView\(next\)[\s\S]*loadView\(next\.group\.id\)/,
    )
    expect(source).toContain('onViewChange={refreshViewAfterMutation}')
    expect(source).toContain('onSaved={refreshViewAfterMutation}')
  })
})
