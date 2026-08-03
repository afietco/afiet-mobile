/**
 * FAZ A GEÇİCİ VERİSİ. Ayın puanının kaynak kaynak dökümü henüz uçtan gelmiyor.
 * Backend `xp_events`i zaten kaynak damgasıyla tutuyor; uç yazılınca bu dosya
 * SİLİNİR ve kart gerçek toplamı gösterir.
 *
 * Şekli uç sözleşmesinin aynısı (`MonthBreakdownRow[]`), böylece bağlarken
 * kartın tek satırı değişmiyor. Toplam gerçek puandan bölünüyor ki ekrandaki
 * iki sayı birbirini tutsun; uydurma bir toplam kartı yalancı yapardı.
 */
import type { XpSource } from '@afiet/core'
import { XP_REWARDS } from '@afiet/core'
import type { MonthBreakdownRow } from './MonthBreakdownCard'

/** Gerçekçi bir dağılım: puanın çoğu afiyet gününden, kalanı kayıtlardan. */
const SHARES: { source: XpSource; share: number }[] = [
  { source: 'afiyet_day', share: 0.55 },
  { source: 'meal_entry', share: 0.2 },
  { source: 'afiyet_week', share: 0.12 },
  { source: 'water_goal', share: 0.07 },
  { source: 'measurement', share: 0.04 },
  { source: 'greeting', share: 0.02 },
]

export function mockMonthBreakdown(total: number): MonthBreakdownRow[] {
  if (total <= 0) return []

  /* Her satırda count x ödül = amount olmak ZORUNDA: "3 kez +76" diye bir gün
     yok ve gerçek uçta da olmayacak. O yüzden paylar tam sayı adede çevrilir,
     kalan artığı yalnız birim değeri 1 olan kaynak (selam) yutar; başlıktaki
     toplam da böylece satırların toplamına eşit kalır. */
  const rows: MonthBreakdownRow[] = []
  let spent = 0
  for (const { source, share } of SHARES) {
    if (source === 'greeting') continue
    const reward = XP_REWARDS[source]
    const count = Math.floor((total * share) / reward)
    if (count <= 0) continue
    rows.push({ source, amount: count * reward, count })
    spent += count * reward
  }

  const remainder = total - spent
  if (remainder > 0) rows.push({ source: 'greeting', amount: remainder, count: remainder })
  return rows
}
