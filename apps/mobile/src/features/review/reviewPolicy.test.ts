import { describe, expect, it } from 'vitest'
import { REVIEW_COOLDOWN_MS, REVIEW_MIN_WEEKS, shouldAskForReview } from './reviewPolicy'

const NOW = Date.UTC(2026, 7, 13, 9, 0, 0)

describe('shouldAskForReview', () => {
  it('stays quiet on the first closed week', () => {
    expect(shouldAskForReview({ totalWeeks: 1, lastAskedAt: null, now: NOW })).toBe(false)
  })

  it('asks once the rhythm is real', () => {
    expect(
      shouldAskForReview({ totalWeeks: REVIEW_MIN_WEEKS, lastAskedAt: null, now: NOW }),
    ).toBe(true)
  })

  it('stays quiet inside the cooldown', () => {
    expect(
      shouldAskForReview({
        totalWeeks: 9,
        lastAskedAt: NOW - REVIEW_COOLDOWN_MS + 1,
        now: NOW,
      }),
    ).toBe(false)
  })

  it('asks again once the cooldown is over', () => {
    expect(
      shouldAskForReview({ totalWeeks: 9, lastAskedAt: NOW - REVIEW_COOLDOWN_MS, now: NOW }),
    ).toBe(true)
  })

  // A device clock moved backwards must not read as "the cooldown ended".
  it('stays quiet when the stamp is in the future', () => {
    expect(
      shouldAskForReview({ totalWeeks: 9, lastAskedAt: NOW + REVIEW_COOLDOWN_MS, now: NOW }),
    ).toBe(false)
  })
})
