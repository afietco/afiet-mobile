import { parseApiTimestampMs } from '@/data/api/timestamps'

export interface AfiGuideProgress {
  mealDone: boolean
  waterDone: boolean
  measurementDone: boolean
}

export type AfiGuideStep = 'welcome' | 'meal' | 'water' | 'body' | 'complete'

const NEW_ACCOUNT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000

export function nextAfiGuideStep(progress: AfiGuideProgress): Exclude<AfiGuideStep, 'welcome'> {
  if (!progress.mealDone) return 'meal'
  if (!progress.waterDone) return 'water'
  if (!progress.measurementDone) return 'body'
  return 'complete'
}

export function shouldStartAfiGuide({
  profileCreatedAt,
  legacyGuideShown,
  legacyGuideDone,
  nowMs = Date.now(),
}: {
  profileCreatedAt: string
  legacyGuideShown: boolean
  legacyGuideDone: boolean
  nowMs?: number
}): boolean {
  if (legacyGuideDone) return false
  if (legacyGuideShown) return true

  const createdAtMs = parseApiTimestampMs(profileCreatedAt)
  if (!Number.isFinite(createdAtMs)) return false
  return Math.max(0, nowMs - createdAtMs) < NEW_ACCOUNT_WINDOW_MS
}
