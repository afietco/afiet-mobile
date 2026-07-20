import { turkishLower } from '@afiet/core'

const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/

/** Normalizes the handle accepted by both registration and profile editing. */
export function normalizeUsername(value: string): string {
  return turkishLower(value.replace(/[@\s]/g, ''))
}

/** Usernames are 3-20 lowercase ASCII letters, digits, underscores, or dots. */
export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(value))
}
