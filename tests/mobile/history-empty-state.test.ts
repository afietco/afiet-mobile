import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { recentHistoryDays } from '../../apps/mobile/src/features/insights/history-days'

describe('history empty state', () => {
  it('does not invent a placeholder day before the first real record', () => {
    expect(recentHistoryDays('2026-07-20', [], 7)).toEqual([])
  })

  it('lists recent days only as far back as the first record', () => {
    expect(recentHistoryDays('2026-07-20', ['2026-07-18'], 7)).toEqual([
      '2026-07-20',
      '2026-07-19',
      '2026-07-18',
    ])
  })

  it('shows a warm first-record invitation linked to the add flow', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/insights/history-section.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('Geçmişin ilk kaydınla başlar')
    expect(source).toContain('İlk kaydını ekle')
    expect(source).toContain('<Link href="/ekle" asChild>')
  })
})
