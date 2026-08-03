import { describe, expect, it } from 'vitest'
import { standingsWindow } from './league'

const table = Array.from({ length: 12 }, (_, i) => ({ rank: i + 1, score: 100 - i }))

describe('sıralama penceresi', () => {
  it('ortadakinde bir üst ve bir alt komşuyu verir', () => {
    expect(standingsWindow(table, 6).map((r) => r.rank)).toEqual([5, 6, 7])
  })

  it('birincide pencereyi aşağı kaydırır, kısaltmaz', () => {
    // Üstte kimse yok; üç satır yine üç satır kalır.
    expect(standingsWindow(table, 1).map((r) => r.rank)).toEqual([1, 2, 3])
  })

  it('sonuncuda pencereyi yukarı kaydırır', () => {
    expect(standingsWindow(table, 12).map((r) => r.rank)).toEqual([10, 11, 12])
  })

  it('tablo pencereden küçükse olduğu gibi döner', () => {
    const küçük = table.slice(0, 2)
    expect(standingsWindow(küçük, 1)).toEqual(küçük)
  })

  it('sıra tabloda yoksa baştan keser', () => {
    expect(standingsWindow(table, 99).map((r) => r.rank)).toEqual([1, 2, 3])
  })

  it('istenen boyutu korur', () => {
    expect(standingsWindow(table, 6, 5).map((r) => r.rank)).toEqual([4, 5, 6, 7, 8])
  })
})
