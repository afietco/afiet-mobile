import { toISODate } from '@afiet/core'

/** Uses the current local day for new meals while preserving an edited entry's day. */
export function resolveMealEntryDate(existingDate?: string, now = new Date()): string {
  return existingDate ?? toISODate(now)
}
