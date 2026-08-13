/**
 * When afiet is allowed to ask for a store review.
 *
 * The ask is anchored to the week closing, which is the one moment the app
 * knows somebody got what they came for: a week of afiyet days is the product
 * working, and the celebration is already on screen when it happens. Anything
 * cheaper to reach (a logged meal, a launch count, a day counter) would be a
 * threshold we can measure rather than a moment we can trust.
 *
 * Both stores ration these prompts and neither tells us whether one was
 * actually shown, so a wasted ask is invisible and unrecoverable. That is why
 * the policy is deliberately stingy: the first closed week is the novelty of a
 * new app, the second is a habit, and once asked we stay quiet for months.
 *
 * Pure on purpose: the decision is unit tested and the caller owns the clock
 * and the storage.
 */

export interface ReviewAskInput {
  /** Total afiyet weeks including the one that just closed. */
  totalWeeks: number
  /** When we last asked, in epoch ms, or null when we never have. */
  lastAskedAt: number | null
  now: number
}

/** The first closed week is still the honeymoon; the second is a rhythm. */
export const REVIEW_MIN_WEEKS = 2

/**
 * Four months of silence after an ask. Apple caps at three prompts a year on
 * its own, so this keeps us well inside a limit we cannot observe, and it is
 * long enough that a second ask lands on a genuinely different afiet.
 */
export const REVIEW_COOLDOWN_MS = 120 * 24 * 60 * 60 * 1000

export function shouldAskForReview({ totalWeeks, lastAskedAt, now }: ReviewAskInput): boolean {
  if (totalWeeks < REVIEW_MIN_WEEKS) return false
  if (lastAskedAt === null) return true
  /* A stamp in the future means the clock moved, not that the cooldown ended.
     Staying quiet is the recoverable direction: the next closed week asks
     again once the stamp is in the past. */
  if (lastAskedAt > now) return false
  return now - lastAskedAt >= REVIEW_COOLDOWN_MS
}
