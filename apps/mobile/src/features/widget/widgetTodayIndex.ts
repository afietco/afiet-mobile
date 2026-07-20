interface WidgetDay {
  date: string
}

/** Uses the local weekday when an incomplete or stale week omits today's date. */
export function resolveWidgetTodayIndex(
  days: WidgetDay[],
  today: string,
  localDayOfWeek = new Date().getDay(),
): number {
  const matchingIndex = days.findIndex((day) => day.date === today)
  return matchingIndex >= 0 ? matchingIndex : (localDayOfWeek + 6) % 7
}
