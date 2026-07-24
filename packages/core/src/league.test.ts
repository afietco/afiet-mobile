import { describe, expect, it } from 'vitest'
import {
  isFloorTier,
  isTopTier,
  LEAGUE_TIERS,
  outcomeForRank,
  promotionCount,
  relegationCount,
  seasonEnd,
  tierAbove,
  tierBelow,
  tierByKey,
} from './league'

describe('kademeler', () => {
  it('baharat yolu beş kademedir ve sıralıdır', () => {
    expect(LEAGUE_TIERS.map((t) => t.key)).toEqual(['tuz', 'nane', 'kekik', 'sumak', 'safran'])
    expect(LEAGUE_TIERS.map((t) => t.order)).toEqual([1, 2, 3, 4, 5])
  })

  it('zemin ve zirve doğru işaretlenir', () => {
    expect(isFloorTier('tuz')).toBe(true)
    expect(isFloorTier('nane')).toBe(false)
    expect(isTopTier('safran')).toBe(true)
  })

  it('komşu kademeler zincirlenir, uçlarda null döner', () => {
    expect(tierAbove('tuz')?.key).toBe('nane')
    expect(tierBelow('nane')?.key).toBe('tuz')
    expect(tierBelow('tuz')).toBeNull()
    expect(tierAbove('safran')).toBeNull()
  })

  it('bilinmeyen anahtar zemin kademeye düşer', () => {
    expect(tierByKey('yok' as never).key).toBe('tuz')
  })
})

describe('ay sonu kesimi', () => {
  it('25 kişilik sofrada dilimler %20 olur', () => {
    expect(promotionCount(25)).toBe(5)
    expect(relegationCount(25, 'kekik')).toBe(5)
  })

  it('Tuz kademesinden kimse düşmez', () => {
    expect(relegationCount(25, 'tuz')).toBe(0)
    expect(outcomeForRank(25, 25, 'tuz')).toBe('stay')
  })

  it('Safran kademesinde yükselme yoktur', () => {
    expect(outcomeForRank(1, 25, 'safran')).toBe('stay')
    expect(outcomeForRank(25, 25, 'safran')).toBe('demote')
  })

  it('orta kademede ilk %20 yükselir, son %20 iner', () => {
    expect(outcomeForRank(1, 25, 'kekik')).toBe('promote')
    expect(outcomeForRank(5, 25, 'kekik')).toBe('promote')
    expect(outcomeForRank(6, 25, 'kekik')).toBe('stay')
    expect(outcomeForRank(20, 25, 'kekik')).toBe('stay')
    expect(outcomeForRank(21, 25, 'kekik')).toBe('demote')
  })

  it('tek kişilik sofrada kimse yükselmez ya da düşmez', () => {
    expect(promotionCount(1)).toBe(0)
    expect(outcomeForRank(1, 1, 'kekik')).toBe('stay')
  })
})

describe('mevsim penceresi', () => {
  it('ayın son gününün sonunu verir', () => {
    // Temmuz 2026: 31 gün.
    const end = seasonEnd(2026, 6)
    expect(end.getDate()).toBe(31)
    expect(end.getMonth()).toBe(6)
    expect(end.getHours()).toBe(23)
  })

  it('artık yıl şubatını doğru bitirir', () => {
    expect(seasonEnd(2028, 1).getDate()).toBe(29)
  })
})
