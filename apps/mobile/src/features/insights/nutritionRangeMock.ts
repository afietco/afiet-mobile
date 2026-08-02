/**
 * FAZ A GEÇİCİ VERİSİ. Backend'de `/v1/summary/range` hazır olunca bu dosya
 * SİLİNİR ve `useNutritionRange` gerçek uca bağlanır.
 *
 * Şekli kasten uç sözleşmesinin aynısı (`NutritionDay[]`), böylece bağlarken
 * ekran kodunun tek satırı değişmiyor. Sayılar gerçekçi ama uydurma: iki boş
 * gün, hafta sonu düşüşü ve makrosu tanınmayan birkaç kayıt var, çünkü ekranın
 * asıl sınandığı yerler bunlar.
 */
import type { NutritionDay } from '@afiet/core'
import { addDays } from '@afiet/core'

/** Deterministik: ekran görüntüsü her koşuda aynı çıksın. */
function pseudoRandom(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return value - Math.floor(value)
}

export function mockNutritionRange(endDate: string, days = 30): NutritionDay[] {
  const start = addDays(endDate, -(days - 1))
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(start, index)
    const weekday = new Date(date).getDay()
    const noise = pseudoRandom(index + 1)

    // İki gün hiç kayıt yok: ortalamaların bunları sıfır saymadığı görülsün.
    if (index === 6 || index === 19) {
      return {
        date,
        kcal: 0,
        protein: 0,
        carb: 0,
        fat: 0,
        fiberG: 0,
        knownCount: 0,
        unknownCount: 0,
        balanceScore: 0,
        waterGlasses: 0,
      }
    }

    const weekend = weekday === 0 || weekday === 6
    const kcal = Math.round(1750 + noise * 550 + (weekend ? 250 : 0))
    const proteinShare = 0.2 + noise * 0.08
    const fatShare = 0.28 + noise * 0.07
    const carbShare = 1 - proteinShare - fatShare

    return {
      date,
      kcal,
      protein: Math.round((kcal * proteinShare) / 4),
      carb: Math.round((kcal * carbShare) / 4),
      fat: Math.round((kcal * fatShare) / 9),
      fiberG: Math.round(14 + noise * 12),
      knownCount: 3 + Math.floor(noise * 3),
      unknownCount: noise > 0.78 ? 1 : 0,
      balanceScore: weekend ? 2 + Math.floor(noise * 2) : 3 + Math.floor(noise * 3),
      waterGlasses: Math.round(6 + noise * 6),
    }
  })
}
