import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { isPublicRootPath } from '../../apps/mobile/src/features/auth/root-auth-gate'

describe('Google OAuth callback recovery', () => {
  it('keeps the callback route reachable before authentication', () => {
    expect(isPublicRootPath('/oauth-callback')).toBe(true)
  })

  it('matches the configured callback URI and restarts an interrupted flow', async () => {
    const [flowSource, routeSource] = await Promise.all([
      readFile(
        new URL('../../apps/mobile/src/features/auth/googleSignIn.ts', import.meta.url),
        'utf8',
      ),
      readFile(new URL('../../apps/mobile/src/app/oauth-callback.tsx', import.meta.url), 'utf8'),
    ])

    expect(flowSource).toContain(
      "const REDIRECT_URI = 'stack-auth-mobile-oauth-url://oauth-callback'",
    )
    expect(flowSource).toContain('export function isGoogleSignInFlowActive()')
    expect(routeSource).toContain('void restartGoogleSignIn()')
    expect(routeSource).toContain('const authenticated = await signInWithGoogle()')
    expect(routeSource).toContain('<Redirect href="/(tabs)" />')
  })
})
