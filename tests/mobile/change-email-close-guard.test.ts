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
  it('persists and restores the pending channel before exposing the waiting step', async () => {
    const source = await readFile(changeEmailSheetPath, 'utf8')
    const restore = source.indexOf('loadPendingEmailChange(userId)')
    const persist = source.indexOf('await savePendingEmailChange({')
    const exposeChannel = source.indexOf('setChannelId(id)', persist)

    expect(restore).toBeGreaterThan(-1)
    expect(persist).toBeGreaterThan(-1)
    expect(exposeChannel).toBeGreaterThan(persist)
  })

  it('blocks dismissal during every email-change request', async () => {
    const source = await readFile(changeEmailSheetPath, 'utf8')
    const closeGuard = source.indexOf('if (closeBlocked) return')
    const abortPendingChange = source.indexOf('void abortEmailChange(channelId)', closeGuard)
    const clearPendingChange = source.indexOf('.then(() => clearPendingEmailChange())', closeGuard)

    expect(source).toContain("const closeBlocked = restoring || busy || resendState === 'sending'")
    expect(source).toContain('enablePanDownToClose={!closeBlocked}')
    expect(closeGuard).toBeGreaterThan(-1)
    expect(abortPendingChange).toBeGreaterThan(closeGuard)
    expect(clearPendingChange).toBeGreaterThan(abortPendingChange)
  })

  it('disables pan, backdrop, and close-button dismissal together', async () => {
    const source = await readFile(sharedSheetPath, 'utf8')

    expect(source).toContain('enablePanDownToClose={enablePanDownToClose}')
    expect(source).toContain("pressBehavior={enablePanDownToClose ? 'close' : 'none'}")
    expect(source).toContain('disabled={!enablePanDownToClose}')
    expect(source).toMatch(/if \(open && !enablePanDownToClose\)[\s\S]*ref\.current\?\.expand\(\)/)
  })
})
