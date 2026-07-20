import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const rootLayoutPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/_layout.tsx', import.meta.url),
)
const onboardingPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/onboarding.tsx', import.meta.url),
)

describe('pending group invitation routing', () => {
  it('hydrates persisted invitations before hiding the splash screen', async () => {
    const source = await readFile(rootLayoutPath, 'utf8')

    expect(source).toContain('loadPendingJoin()')
    expect(source).toMatch(/Promise\.all\(\[loadInitialTheme\(\), loadFtueFlags\(\), loadPendingJoin\(\)\]\)/)
  })

  it('opens the group tab after onboarding when an invitation remains', async () => {
    const source = await readFile(onboardingPath, 'utf8')

    expect(source).toContain("const finishDestination = () => (peekPendingJoin() ? '/grubum' : '/')")
    expect(source.match(/router\.replace\(finishDestination\(\)\)/g)).toHaveLength(2)
  })
})
