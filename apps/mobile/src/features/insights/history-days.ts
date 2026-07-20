import { addDays } from '@afiet/core'

/** Returns no placeholder days until the user has created a real history record. */
export function recentHistoryDays(
  today: string,
  firstRecordDates: string[],
  dayCount: number,
): string[] {
  if (firstRecordDates.length === 0) return []
  const firstDate = [...firstRecordDates].sort()[0]
  return Array.from({ length: dayCount }, (_, index) => addDays(today, -index)).filter(
    (date) => date >= firstDate,
  )
}
