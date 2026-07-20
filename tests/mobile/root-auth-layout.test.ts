import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('root authentication layout', () => {
  it('mounts the authentication gate beside the root navigator', async () => {
    const layoutPath = fileURLToPath(
      new URL('../../apps/mobile/src/app/_layout.tsx', import.meta.url),
    )
    const source = await readFile(layoutPath, 'utf8')

    expect(source).toMatch(/<Stack screenOptions=\{\{ headerShown: false \}\} \/>/)
    expect(source).toContain('<RootAuthGate />')
  })
})
