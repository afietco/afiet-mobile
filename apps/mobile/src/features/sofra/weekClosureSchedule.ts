export const WEEK_CLOSURE_RETRY_DELAY_MS = 15_000

/** A successful response suppresses repeat checks only for the current local day. */
export function shouldCheckWeekClosure(
  lastCheckedDate: string | null,
  currentDate: string,
): boolean {
  return lastCheckedDate !== currentDate
}
