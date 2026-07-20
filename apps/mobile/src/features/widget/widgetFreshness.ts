interface DatedWidgetSnapshot {
  weekStart: string
  savedAt: string
}

function localISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function widgetWeekStart(now = new Date()): string {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return localISODate(monday)
}

/** Rejects snapshots from another local week or with an invalid persistence timestamp. */
export function isWidgetSnapshotCurrent(
  snapshot: DatedWidgetSnapshot,
  now = new Date(),
): boolean {
  const savedAt = new Date(snapshot.savedAt)
  if (!Number.isFinite(savedAt.getTime()) || savedAt.getTime() > now.getTime()) return false
  return snapshot.weekStart === widgetWeekStart(now) && widgetWeekStart(savedAt) === snapshot.weekStart
}
