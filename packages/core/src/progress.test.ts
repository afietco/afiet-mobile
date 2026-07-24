import { describe, expect, it } from 'vitest'
import {
  levelFromXp,
  levelProgress,
  levelsToNextTitle,
  titleForLevel,
  totalXpForLevel,
  xpCostForNextLevel,
} from './progress'

describe('seviye eğrisi', () => {
  it('tasarımdaki eşiklerle uyuşur', () => {
    // docs/10 tablosu: 2 → 60, 4 → 240, 5 → 360, 10 → 1260
    expect(totalXpForLevel(2)).toBe(60)
    expect(totalXpForLevel(4)).toBe(240)
    expect(totalXpForLevel(5)).toBe(360)
    expect(totalXpForLevel(10)).toBe(1260)
  })

  it('seviye 1 sıfır tecrübeyle başlar', () => {
    expect(totalXpForLevel(1)).toBe(0)
    expect(levelFromXp(0)).toBe(1)
  })

  it('sonraki seviye maliyeti her seviyede artar', () => {
    const costs = [1, 2, 3, 10, 20].map(xpCostForNextLevel)
    for (let i = 1; i < costs.length; i += 1) {
      expect(costs[i]!).toBeGreaterThan(costs[i - 1]!)
    }
  })

  it('eşiğin bir altı henüz seviye atlatmaz', () => {
    expect(levelFromXp(totalXpForLevel(5) - 1)).toBe(4)
    expect(levelFromXp(totalXpForLevel(5))).toBe(5)
  })

  it('normal bir ilk hafta 4. seviyeye ulaştırır', () => {
    // docs/10: hedefi tutturan sıradan hafta ~210 tecrübe.
    expect(levelFromXp(210)).toBe(3)
    // Hafta bonusuyla birlikte 4. seviye eşiği (240) hemen yakalanır.
    expect(levelFromXp(240)).toBe(4)
  })
})

describe('unvan bantları', () => {
  it('bant sınırlarında doğru unvanı verir', () => {
    expect(titleForLevel(1)).toBe('Yeni Sofra')
    expect(titleForLevel(4)).toBe('Yeni Sofra')
    expect(titleForLevel(5)).toBe('Denge Yolcusu')
    expect(titleForLevel(14)).toBe('Sofra Dostu')
    expect(titleForLevel(30)).toBe('Sofra Piri')
  })

  it('zirve bandın üstünde unvan sabit kalır', () => {
    expect(titleForLevel(99)).toBe('Sofra Piri')
    expect(levelsToNextTitle(99)).toBeNull()
  })

  it('sonraki unvana kalan seviyeyi sayar', () => {
    expect(levelsToNextTitle(4)).toBe(1)
    expect(levelsToNextTitle(1)).toBe(4)
  })
})

describe('levelProgress', () => {
  it('seviye içi ilerlemeyi 0..1 aralığında verir', () => {
    const floor = totalXpForLevel(5)
    const cost = xpCostForNextLevel(5)
    const p = levelProgress(floor + cost / 2)

    expect(p.level).toBe(5)
    expect(p.title).toBe('Denge Yolcusu')
    expect(p.xpIntoLevel).toBe(cost / 2)
    expect(p.xpToNext).toBe(cost / 2)
    expect(p.ratio).toBeCloseTo(0.5)
  })

  it('negatif ve kesirli girdiyi güvenle sıfıra çeker', () => {
    const p = levelProgress(-500)
    expect(p.level).toBe(1)
    expect(p.totalXp).toBe(0)
    expect(p.ratio).toBe(0)
  })

  it('seviye atlama anında oran sıfırlanır ve seviye artar', () => {
    const p = levelProgress(totalXpForLevel(6))
    expect(p.level).toBe(6)
    expect(p.xpIntoLevel).toBe(0)
    expect(p.ratio).toBe(0)
  })
})
