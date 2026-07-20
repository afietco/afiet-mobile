import { parseApiTimestampMs } from '@/data/api/timestamps'

const NEW_USER_FOCUS_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

interface FocusedHomeInput {
  profileCreatedAt: string
  hasMealRecord: boolean
  nowMs?: number
}

/** Keeps the dashboard focused only while a new account has no meal history. */
export function shouldShowFocusedHome({
  profileCreatedAt,
  hasMealRecord,
  nowMs = Date.now(),
}: FocusedHomeInput): boolean {
  if (hasMealRecord) return false

  const createdAtMs = parseApiTimestampMs(profileCreatedAt)
  if (!Number.isFinite(createdAtMs)) return false

  const accountAgeMs = Math.max(0, nowMs - createdAtMs)
  return accountAgeMs < NEW_USER_FOCUS_WINDOW_MS
}
