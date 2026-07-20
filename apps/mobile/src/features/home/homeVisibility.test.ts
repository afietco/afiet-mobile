import { describe, expect, it } from 'vitest'
import { shouldShowFocusedHome } from './homeVisibility'

const NOW_MS = Date.parse('2026-07-20T12:00:00.000Z')

describe('shouldShowFocusedHome', () => {
  it('focuses a new account with no meal history', () => {
    expect(
      shouldShowFocusedHome({
        profileCreatedAt: '2026-07-19T12:00:00.000Z',
        hasMealRecord: false,
        nowMs: NOW_MS,
      }),
    ).toBe(true)
  })

  it('reveals the remaining cards after the first meal', () => {
    expect(
      shouldShowFocusedHome({
        profileCreatedAt: '2026-07-20T11:00:00.000Z',
        hasMealRecord: true,
        nowMs: NOW_MS,
      }),
    ).toBe(false)
  })

  it('returns to the full dashboard after the two-day focus window', () => {
    expect(
      shouldShowFocusedHome({
        profileCreatedAt: '2026-07-18T12:00:00.000Z',
        hasMealRecord: false,
        nowMs: NOW_MS,
      }),
    ).toBe(false)
  })

  it('does not hide cards when the account timestamp is invalid', () => {
    expect(
      shouldShowFocusedHome({
        profileCreatedAt: 'invalid',
        hasMealRecord: false,
        nowMs: NOW_MS,
      }),
    ).toBe(false)
  })
})
