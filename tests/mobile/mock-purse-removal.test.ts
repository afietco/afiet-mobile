import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appHeader = readFileSync(
  new URL('../../apps/mobile/src/features/nav/AppHeader.tsx', import.meta.url),
  'utf8',
)
const pursePath = new URL(
  '../../apps/mobile/src/features/sofra/SofraKeseButton.tsx',
  import.meta.url,
)

describe('Sofra purse availability', () => {
  it('does not expose a mock balance before the feature has real data', () => {
    expect(appHeader).not.toContain('SofraKeseButton')
    expect(appHeader).not.toContain('MOCK_BALANCE')
    expect(existsSync(pursePath)).toBe(false)
  })
})
