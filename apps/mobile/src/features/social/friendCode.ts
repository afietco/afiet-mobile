/**
 * Permanent 8-character friend code, generated server-side with the same
 * alphabet as group invite codes (no I/O/0/1). It replaces the old @username:
 * people are added by code, never discovered by handle.
 */
export const FRIEND_CODE_LENGTH = 8

/** Uppercases and strips everything outside A-Z/0-9 so a pasted code with
    spaces or dashes still resolves. Deliberately no truncation: only an
    exactly 8-character value counts as a code, so longer names never get
    mistaken for one. */
export function normalizeFriendCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/** Whether the normalized value has the exact shape of a friend code. */
export function isFriendCode(value: string): boolean {
  return /^[A-Z0-9]{8}$/.test(value)
}
