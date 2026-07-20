import { describe, expect, it } from 'vitest'
import { resolveWidgetTodayIndex } from '../../apps/mobile/src/features/widget/widgetTodayIndex'

const week = [
  { date: '2026-07-20' },
  { date: '2026-07-21' },
  { date: '2026-07-22' },
  { date: '2026-07-23' },
  { date: '2026-07-24' },
  { date: '2026-07-25' },
  { date: '2026-07-26' },
]

describe('widget today index', () => {
  it('uses the matching date when the current day exists in the week', () => {
    expect(resolveWidgetTodayIndex(week, '2026-07-23', 1)).toBe(3)
  })

  it('falls back to the local Monday-based weekday instead of Monday', () => {
    expect(resolveWidgetTodayIndex(week, '2026-07-27', 4)).toBe(3)
    expect(resolveWidgetTodayIndex([], '2026-07-26', 0)).toBe(6)
  })
})
