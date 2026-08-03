import { describe, expect, it } from 'vitest'
import { breakdownLines } from './monthBreakdown'

const sum = (rows: { amount: number }[]) => rows.reduce((total, row) => total + row.amount, 0)

describe('ay dökümü satırları', () => {
  it('hiçbir puanı düşürmez', () => {
    // Asıl iddia: satırların toplamı, gelen toplamın AYNISI. Bir kaynağı elemek
    // ekranda başlıkla satırların ayrışması demekti (103 derken 63 gösteriyordu).
    const rows = [
      { source: 'afiyet_day', amount: 40, count: 2 },
      { source: 'quest', amount: 30, count: 3 },
      { source: 'admin_adjust', amount: 10, count: 1 },
      { source: 'meal_entry', amount: 8, count: 4 },
    ]
    expect(sum(breakdownLines(rows))).toBe(sum(rows))
  })

  it('tanımadığı kaynakları tek "Diğer" satırında toplar', () => {
    // Sunucu enum'u ileride büyürse ekran yine tutarlı kalmalı.
    const lines = breakdownLines([
      { source: 'afiyet_day', amount: 40, count: 2 },
      { source: 'gelecekteki_kaynak', amount: 7, count: 2 },
      { source: 'bir_baskasi', amount: 3, count: 1 },
    ])
    const other = lines.find((line) => line.key === 'other')
    expect(other?.amount).toBe(10)
    expect(other?.count).toBe(3)
  })

  it('"Diğer" satırını en sona koyar, bilinenleri büyükten küçüğe sıralar', () => {
    const lines = breakdownLines([
      { source: 'meal_entry', amount: 8, count: 4 },
      { source: 'bilinmeyen', amount: 99, count: 1 },
      { source: 'afiyet_day', amount: 40, count: 2 },
    ])
    expect(lines.map((line) => line.key)).toEqual(['afiyet_day', 'meal_entry', 'other'])
  })

  it('sıfır puanlı kaynağı çizmez', () => {
    expect(breakdownLines([{ source: 'greeting', amount: 0, count: 0 }])).toEqual([])
  })
})
