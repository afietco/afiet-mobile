/** YYYY-MM-DD (yerel saat) */
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

const longFmt = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const shortFmt = new Intl.DateTimeFormat('tr-TR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export function formatLongTR(iso: string): string {
  return longFmt.format(fromISO(iso))
}

export function formatShortTR(iso: string): string {
  return shortFmt.format(fromISO(iso))
}

export function relativeDayLabel(iso: string): string | null {
  const today = todayISO()
  if (iso === today) return 'Bugün'
  if (iso === addDays(today, -1)) return 'Dün'
  return null
}
