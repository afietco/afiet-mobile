import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

/* Apple binds the "Share My Email" / "Hide My Email" choice to the Apple ID
   and the App ID on its own servers. The sheet is shown once and every later
   signInAsync reuses the decision silently, so nothing the app sends can
   re-open it. These tests pin what the app can actually control: an honest
   button label, an email sync that survives a changed provider address, and
   an in-app path out of a relay address. */
describe('apple sign-in and the private relay address', () => {
  it('labels the Apple button after the card mode instead of always "sign in"', () => {
    const login = source('../../apps/mobile/src/app/login.tsx')
    expect(login).toContain("mode === 'signup'")
    expect(login).toContain('AppleAuthenticationButtonType.SIGN_UP')
    expect(login).toContain('AppleAuthenticationButtonType.SIGN_IN')
  })

  it('keeps requesting the email scope so the first authorization can offer it', () => {
    const login = source('../../apps/mobile/src/app/login.tsx')
    expect(login).toContain('AppleAuthentication.AppleAuthenticationScope.EMAIL')
  })

  it('offers the account screen a way out of a relay address', () => {
    const hesap = source('../../apps/mobile/src/app/hesap.tsx')
    expect(hesap).toContain('isApplePrivateRelayEmail')
    expect(hesap).toContain('Gerçek e-postamı ekle')
    // The invitation opens the existing change-email flow rather than a new one.
    expect(hesap).toContain('setEmailOpen(true)')
  })
})
