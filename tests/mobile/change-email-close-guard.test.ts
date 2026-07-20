import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const changeEmailSheetPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/auth/ChangeEmailSheet.tsx', import.meta.url),
)
const sharedSheetPath = fileURLToPath(
  new URL('../../apps/mobile/src/ui/Sheet.tsx', import.meta.url),
)

describe('email change dismissal guard', () => {
  it('blocks dismissal during every email-change request', async () => {
    const source = await readFile(changeEmailSheetPath, 'utf8')
    const closeGuard = source.indexOf('if (closeBlocked) return')
    const abortPendingChange = source.indexOf('void abortEmailChange(channelId)', closeGuard)

    expect(source).toContain("const closeBlocked = busy || resendState === 'sending'")
    expect(source).toContain('enablePanDownToClose={!closeBlocked}')
    expect(closeGuard).toBeGreaterThan(-1)
    expect(abortPendingChange).toBeGreaterThan(closeGuard)
  })

  it('disables pan, backdrop, and close-button dismissal together', async () => {
    const source = await readFile(sharedSheetPath, 'utf8')

    expect(source).toContain('enablePanDownToClose={enablePanDownToClose}')
    expect(source).toContain("pressBehavior={enablePanDownToClose ? 'close' : 'none'}")
    expect(source).toContain('disabled={!enablePanDownToClose}')
    expect(source).toMatch(/if \(open && !enablePanDownToClose\)[\s\S]*ref\.current\?\.expand\(\)/)
  })
})
