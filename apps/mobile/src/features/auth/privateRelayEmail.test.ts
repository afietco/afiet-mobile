import { describe, expect, it } from 'vitest'
import { isApplePrivateRelayEmail } from './privateRelayEmail'

describe('isApplePrivateRelayEmail', () => {
  it('recognizes a relay address', () => {
    expect(isApplePrivateRelayEmail('sd8x2mn4kq@privaterelay.appleid.com')).toBe(true)
  })

  it('ignores casing and surrounding whitespace', () => {
    expect(isApplePrivateRelayEmail('  SD8X2MN4KQ@PrivateRelay.AppleID.com  ')).toBe(true)
  })

  it('treats an ordinary address as the person’s own', () => {
    expect(isApplePrivateRelayEmail('berk@afiet.co')).toBe(false)
    expect(isApplePrivateRelayEmail('berk@icloud.com')).toBe(false)
  })

  it('does not match a look-alike domain', () => {
    expect(isApplePrivateRelayEmail('mail@notprivaterelay.appleid.com')).toBe(false)
    expect(isApplePrivateRelayEmail('mail@privaterelay.appleid.com.evil.co')).toBe(false)
    expect(isApplePrivateRelayEmail('mail@relay.privaterelay.appleid.com')).toBe(false)
  })

  it('treats a missing address as not a relay', () => {
    expect(isApplePrivateRelayEmail(null)).toBe(false)
    expect(isApplePrivateRelayEmail(undefined)).toBe(false)
    expect(isApplePrivateRelayEmail('')).toBe(false)
  })
})
