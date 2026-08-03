import { describe, expect, it } from 'vitest'
import { XP_REWARDS } from '@afiet/core'
import { mockMonthBreakdown } from './monthBreakdownMock'

describe('geçici ay dökümü', () => {
  it('satırların toplamı başlıktaki sayıyı tutar', () => {
    for (const total of [1, 7, 20, 103, 512, 999]) {
      const sum = mockMonthBreakdown(total).reduce((s, row) => s + row.amount, 0)
      expect(sum).toBe(total)
    }
  })

  it('her satır kendi içinde tutarlı: kez x ödül = puan', () => {
    // "3 kez +76" diye bir gün yok; gerçek uçta da olmayacak.
    for (const total of [7, 103, 512]) {
      for (const row of mockMonthBreakdown(total)) {
        expect(row.amount).toBe(row.count * XP_REWARDS[row.source])
      }
    }
  })

  it('puan yoksa satır da yok', () => {
    expect(mockMonthBreakdown(0)).toEqual([])
  })
})
