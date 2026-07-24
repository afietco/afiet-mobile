import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  ApiNotReadyError,
  requireApi,
  setApiClient,
} from '../../apps/mobile/src/data/api/apiHolder'

const read = (relative: string) =>
  readFile(new URL(`../../apps/mobile/src/${relative}`, import.meta.url), 'utf8')

describe('startup lockout escape', () => {
  it('signals an unbound client with a typed error so the profile gate stays loading', () => {
    setApiClient(null)
    expect(() => requireApi()).toThrow(ApiNotReadyError)
  })

  it('keeps a session-clearing escape on the profile error screen', async () => {
    const source = await read('app/(tabs)/_layout.tsx')
    // The gate must offer a way out of a persistent profile failure, not just retry.
    expect(source).toContain('onSignOut')
  })

  it('keeps a session-clearing escape on the top-level error boundary', async () => {
    const source = await read('ui/AppErrorBoundary.tsx')
    // The boundary sits above the AuthProvider, so it escapes via the module-level
    // reset that also clears the Keychain tokens surviving an app reinstall.
    expect(source).toContain('hardResetToAnon')
  })
})
