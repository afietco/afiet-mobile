/** Formats a date as YYYY-MM-DD in the current local time zone. */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const LONG_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}

const SHORT_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
}

function formatTR(iso: string, options: Intl.DateTimeFormatOptions): string {
  // A new formatter observes time-zone changes made while the app is running.
  return new Intl.DateTimeFormat('tr-TR', options).format(fromISO(iso))
}

export function formatLongTR(iso: string): string {
  return formatTR(iso, LONG_FORMAT_OPTIONS)
}

export function formatShortTR(iso: string): string {
  return formatTR(iso, SHORT_FORMAT_OPTIONS)
}

export function relativeDayLabel(iso: string): string | null {
  const today = todayISO()
  if (iso === today) return 'Bugün'
  if (iso === addDays(today, -1)) return 'Dün'
  return null
}
