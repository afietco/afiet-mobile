/**
 * Asking the store for a review, at the one moment worth spending it on.
 *
 * The store owns this dialog completely: it decides whether to show anything,
 * it never says whether it did, and it never reports what the person wrote.
 * So `review_prompt_requested` means exactly what its name says - we asked -
 * and it must never be read as "a prompt was shown" or "a review was left"
 * (the same distinction the push pipeline learned the hard way between an
 * event being sent and a notification being delivered).
 *
 * Because the outcome is invisible, the guard rails live entirely on our side:
 * the moment is fixed (a closed afiyet week), the eligibility is in
 * reviewPolicy.ts, and the ask is stamped on disk whether or not the store
 * decided to draw anything.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as StoreReview from 'expo-store-review'
import { track } from '@/lib/track'
import { shouldAskForReview } from './reviewPolicy'

const LAST_ASKED_KEY = 'fh:lastReviewAskAt'

async function readLastAskedAt(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ASKED_KEY)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    /* An unreadable stamp is treated as "never asked". The cooldown is a
       courtesy, and the store's own quota is the real ceiling. */
    return null
  }
}

/**
 * Called once a week celebration has been closed and nothing else is queued.
 * Never throws and never blocks the screen: every failure means no prompt,
 * which is the recoverable direction.
 */
export async function maybeAskForReview(
  totalWeeks: number,
  now: number = Date.now(),
): Promise<void> {
  try {
    const lastAskedAt = await readLastAskedAt()
    if (!shouldAskForReview({ totalWeeks, lastAskedAt, now })) return

    /* False on a simulator, on the web preview and wherever the store cannot
       be reached. Asking anyway would burn the stamp for a dialog that could
       never appear. */
    if (!(await StoreReview.isAvailableAsync())) return
    if (!(await StoreReview.hasAction())) return

    await StoreReview.requestReview()

    /* Stamped after the request, not after a confirmation: there is no
       confirmation to wait for. */
    await AsyncStorage.setItem(LAST_ASKED_KEY, String(now))
    track('review_prompt_requested', { moment: 'week_close', totalWeeks })
  } catch {
    // No prompt this time; the next closed week is a perfectly good retry.
  }
}
