/**
 * Apple's "Hide My Email" hands the app a relay address instead of the
 * person's own one. That choice is bound to the Apple ID and the App ID on
 * Apple's side, so no sign-in option can re-open it: the authorization sheet
 * appears once and every later `signInAsync` silently reuses the decision.
 * The only remedy that lives inside the app is replacing the address
 * afterwards, so the address is detected here and the account screen offers
 * that path. Nothing is ever gated on the result: a relay address is a valid
 * account, and App Review requires it to stay one.
 */
const APPLE_PRIVATE_RELAY_DOMAIN = '@privaterelay.appleid.com'

/**
 * True when the address is an Apple relay address. Anchored on the `@` so a
 * look-alike domain (`mail@notprivaterelay.appleid.com`) does not match.
 */
export function isApplePrivateRelayEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase().endsWith(APPLE_PRIVATE_RELAY_DOMAIN)
}
