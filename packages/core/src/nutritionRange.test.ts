import { describe, expect, it } from 'vitest'
import {
  energyTrend,
  isLoggedDay,
  macroShares,
  roundEnergy,
  summarizeNutritionWindow,
  type NutritionDay,
} from './nutritionRange'

function day(date: string, over: Partial<NutritionDay> = {}): NutritionDay {
  return {
    date,
    kcal: 0,
    protein: 0,
    carb: 0,
    fat: 0,
    knownCount: 0,
    unknownCount: 0,
    balanceScore: 0,
    waterGlasses: 0,
    ...over,
  }
}

/** Balanced day: 25% protein, 50% carb, 25% fat of 2000 kcal. */
function balancedDay(date: string): NutritionDay {
  return day(date, { kcal: 2000, protein: 125, carb: 250, fat: 55.6, knownCount: 3, balanceScore: 5 })
}

describe('kayıtlı gün ayrımı', () => {
  it('kaydı olmayan günü kayıtlı saymaz', () => {
    expect(isLoggedDay(day('2026-08-01'))).toBe(false)
    expect(isLoggedDay(day('2026-08-01', { unknownCount: 1 }))).toBe(true)
  })
})

describe('makro payları', () => {
  it('gramları enerjiye çevirip payları toplamı bire tamamlar', () => {
    const shares = macroShares([balancedDay('2026-08-01')])
    expect(shares).toHaveLength(3)
    const total = shares.reduce((sum, s) => sum + s.share, 0)
    expect(total).toBeCloseTo(1, 5)
  })

  it('payı referans bandına göre konumlar', () => {
    const shares = macroShares([balancedDay('2026-08-01')])
    expect(shares.every((s) => s.position === 'inside')).toBe(true)
  })

  it('bandın dışını dışarıda gösterir', () => {
    // Neredeyse tamamı protein: karb ve yağ bandın altında kalır.
    const shares = macroShares([day('2026-08-01', { protein: 200, carb: 10, fat: 5, knownCount: 1 })])
    expect(shares.find((s) => s.key === 'protein')?.position).toBe('above')
    expect(shares.find((s) => s.key === 'carb')?.position).toBe('below')
  })

  it('enerji yoksa pay üretmez', () => {
    // Sıfır pay "dengesiz" demek olurdu; veri hiçbir şey söylemiyor.
    expect(macroShares([day('2026-08-01')])).toEqual([])
    expect(macroShares([])).toEqual([])
  })

  it('payları gün gün değil toplam gramdan hesaplar', () => {
    // Bir kraker günü, dolu bir gün kadar ağırlık taşımamalı.
    const full = day('2026-08-01', { protein: 125, carb: 250, fat: 55.6, knownCount: 3 })
    const crumb = day('2026-08-02', { protein: 20, carb: 0, fat: 0, knownCount: 1 })
    const shares = macroShares([full, crumb])
    const protein = shares.find((s) => s.key === 'protein')?.share ?? 0
    // Günlük payların ortalaması ~0.62 verirdi; toplam gramdan ~0.29 çıkar.
    expect(protein).toBeLessThan(0.4)
  })
})

describe('pencere özeti', () => {
  it('boş günleri sıfır saymaz, ortalamayı yalnız kayıtlı günlerden alır', () => {
    const window = summarizeNutritionWindow([
      balancedDay('2026-08-01'),
      day('2026-08-02'),
      balancedDay('2026-08-03'),
    ])
    expect(window.emptyDayCount).toBe(1)
    expect(window.loggedDays).toHaveLength(2)
    // Boş gün sıfır sayılsaydı ortalama 1333 olurdu ve düşüş uydurulmuş olurdu.
    expect(window.averageKcal).toBe(2000)
  })

  it('hiç kayıt yoksa ortalama vermez', () => {
    const window = summarizeNutritionWindow([day('2026-08-01'), day('2026-08-02')])
    expect(window.averageKcal).toBeNull()
    expect(window.averageBalance).toBeNull()
    expect(window.shares).toEqual([])
  })

  it('kayıt kalitesini toplar', () => {
    const window = summarizeNutritionWindow([
      day('2026-08-01', { knownCount: 3, unknownCount: 1, kcal: 900, protein: 50, carb: 90, fat: 30 }),
      day('2026-08-02', { knownCount: 2, unknownCount: 2, kcal: 800, protein: 40, carb: 80, fat: 26 }),
    ])
    expect(window.knownCount).toBe(5)
    expect(window.unknownCount).toBe(3)
  })
})

describe('enerji trendi', () => {
  const week = Array.from({ length: 9 }, (_, i) =>
    balancedDay(`2026-08-0${i + 1}`),
  )

  it('pencere dolana kadar ortalama çizmez', () => {
    const points = energyTrend(week, 7)
    expect(points.slice(0, 6).every((p) => p.average === null)).toBe(true)
    expect(points[6]?.average).toBe(2000)
  })

  it('boş günde çizgiyi düşürmez, atlar', () => {
    const days = [balancedDay('2026-08-01'), day('2026-08-02'), balancedDay('2026-08-03')]
    const points = energyTrend(days, 2)
    expect(points[1]?.value).toBeNull()
    // Boş gün sıfır sayılsaydı ikinci ortalama 1000'e düşerdi.
    expect(points[2]?.average).toBe(2000)
  })
})

describe('enerji yuvarlama', () => {
  it('ondalık değil onluk basamağa yuvarlar', () => {
    // ±%15 hata payı olan bir hesabı ondalıkla sunmak sahte hassasiyet.
    expect(roundEnergy(1847.4)).toBe(1850)
    expect(roundEnergy(1844)).toBe(1840)
  })
})
