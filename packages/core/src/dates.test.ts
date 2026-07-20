import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  addDays,
  formatLongTR,
  formatShortTR,
  fromISO,
  relativeDayLabel,
  todayISO,
  toISODate,
} from './dates'

const runtimeEnv = (
  globalThis as typeof globalThis & { process: { env: Record<string, string | undefined> } }
).process.env
const originalTimeZone = runtimeEnv.TZ

afterEach(() => {
  vi.useRealTimers()
  if (originalTimeZone === undefined) delete runtimeEnv.TZ
  else runtimeEnv.TZ = originalTimeZone
})

describe('date helpers', () => {
  it('round-trips local ISO dates without a timezone shift', () => {
    const date = fromISO('2026-07-20')

    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 6, 20])
    expect(toISODate(date)).toBe('2026-07-20')
  })

  it('adds days across month, year, and leap-day boundaries', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('labels today and yesterday against the local clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 20, 12))

    expect(todayISO()).toBe('2026-07-20')
    expect(relativeDayLabel('2026-07-20')).toBe('Bugün')
    expect(relativeDayLabel('2026-07-19')).toBe('Dün')
    expect(relativeDayLabel('2026-07-18')).toBeNull()
  })

  it('formats Turkish long and short labels', () => {
    expect(formatLongTR('2026-07-20')).toMatch(/20.*Temmuz/i)
    expect(formatShortTR('2026-07-20')).toMatch(/20.*Tem/i)
  })

  it('uses the current time zone after the module has loaded', () => {
    runtimeEnv.TZ = 'Pacific/Kiritimati'

    expect(formatLongTR('2026-07-20')).toMatch(/20.*Temmuz/i)
    expect(formatShortTR('2026-07-20')).toMatch(/20.*Tem/i)
  })
})
