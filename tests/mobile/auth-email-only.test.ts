import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { isFriendCode, normalizeFriendCode } from '../../apps/mobile/src/features/social/friendCode'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('email-only auth after the username removal', () => {
  it('keeps every username surface out of the app source', () => {
    const auth = [
      '../../apps/mobile/src/app/login.tsx',
      '../../apps/mobile/src/features/auth/AuthContext.tsx',
      '../../apps/mobile/src/features/auth/stackAuth.ts',
      '../../apps/mobile/src/data/api/client.ts',
    ]
      .map(source)
      .join('\n')

    expect(auth).not.toContain('username-available')
    expect(auth).not.toContain('registrationUsername')
    expect(auth).not.toContain('Kullanıcı adı')
  })

  it('requires an email-shaped identifier for sign-in, sign-up and reset', () => {
    const login = source('../../apps/mobile/src/app/login.tsx')
    expect(login).toContain("if (!identifier.includes('@')) {")
    expect(login).toContain("if (!identifier.trim() || !identifier.includes('@')) {")
    expect(login).toContain('Geçerli bir e-posta adresi gir.')
  })

  it('suppresses the iOS password tooling on sign-up but keeps sign-in autofill', () => {
    const login = source('../../apps/mobile/src/app/login.tsx')
    expect(login).toContain("textContentType={mode === 'signup' ? 'oneTimeCode' : 'password'}")
    expect(login).toContain("autoComplete={mode === 'signup' ? 'off' : 'current-password'}")
    const onboarding = source('../../apps/mobile/src/app/onboarding.tsx')
    expect(onboarding).toContain('textContentType="nickname"')
  })

  it('syncs the signup email to the backend profile for every auth method', () => {
    const auth = source('../../apps/mobile/src/features/auth/AuthContext.tsx')
    expect(auth.match(/syncSignupEmail\(/g)?.length).toBeGreaterThanOrEqual(3)
  })
})

describe('friend code', () => {
  it('normalizes pasted codes without mistaking long names for codes', () => {
    expect(normalizeFriendCode(' ab-cd 23 45 ')).toBe('ABCD2345')
    expect(isFriendCode(normalizeFriendCode('ab-cd 23 45'))).toBe(true)
    expect(isFriendCode(normalizeFriendCode('mehmetcan'))).toBe(false)
    expect(isFriendCode(normalizeFriendCode('kod1234'))).toBe(false)
  })
})
