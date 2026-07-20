import { describe, expect, it } from 'vitest'
import { parseApiTimestampMs } from './timestamps'

describe('API timestamps', () => {
  it('parses RFC 3339 timestamps', () => {
    expect(parseApiTimestampMs('2026-07-20T21:04:43.258Z')).toBe(
      Date.UTC(2026, 6, 20, 21, 4, 43, 258),
    )
  })

  it('normalizes PostgreSQL timestamptz text for Hermes', () => {
    expect(parseApiTimestampMs('2026-07-20 21:04:43.258593+00')).toBe(
      Date.UTC(2026, 6, 20, 21, 4, 43, 258),
    )
  })

  it('returns NaN for invalid timestamps', () => {
    expect(parseApiTimestampMs('not-a-date')).toBeNaN()
  })
})
