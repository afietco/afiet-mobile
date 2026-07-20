import { describe, expect, it } from 'vitest'
import { isValidUsername, normalizeUsername } from './username'

describe('username helpers', () => {
  it('normalizes registration and profile handles the same way', () => {
    expect(normalizeUsername(' @Berk.7 ')).toBe('berk.7')
    expect(normalizeUsername('İSİM')).toBe('isim')
  })

  it('accepts the shared handle format', () => {
    expect(isValidUsername('berk_7')).toBe(true)
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('berk-7')).toBe(false)
  })
})
