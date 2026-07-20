import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  isWidgetSnapshotCurrent,
  widgetWeekStart,
} from '../../apps/mobile/src/features/widget/widgetFreshness'

describe('widget snapshot freshness', () => {
  it('derives a Monday-based local week start', () => {
    expect(widgetWeekStart(new Date(2026, 6, 20, 12))).toBe('2026-07-20')
    expect(widgetWeekStart(new Date(2026, 6, 26, 23))).toBe('2026-07-20')
    expect(widgetWeekStart(new Date(2026, 6, 27, 0))).toBe('2026-07-27')
  })

  it('accepts only snapshots saved during the current local week', () => {
    const now = new Date(2026, 6, 27, 9)
    expect(
      isWidgetSnapshotCurrent(
        { weekStart: '2026-07-27', savedAt: new Date(2026, 6, 27, 8).toISOString() },
        now,
      ),
    ).toBe(true)
    expect(
      isWidgetSnapshotCurrent(
        { weekStart: '2026-07-20', savedAt: new Date(2026, 6, 26, 20).toISOString() },
        now,
      ),
    ).toBe(false)
    expect(isWidgetSnapshotCurrent({ weekStart: '2026-07-27', savedAt: 'invalid' }, now)).toBe(
      false,
    )
  })

  it('keeps the Swift widget contract and stale invitation in sync', async () => {
    const swift = await readFile(
      new URL('../../apps/mobile/targets/ritim/RitimWidget.swift', import.meta.url),
      'utf8',
    )
    expect(swift).toContain('var weekStart: String')
    expect(swift).toContain('var savedAt: String')
    expect(swift).toContain('isCurrentWidgetState')
    expect(swift).toContain("Ritmini tazelemek için afiet'i aç")
  })
})
