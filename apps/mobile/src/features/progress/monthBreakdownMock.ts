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

  /* İki değişmez: satırların toplamı başlıktaki sayıyı tutar VE her satırda
     kez x ödül = puan olur ("3 kez +76" diye bir gün yok). Artığı öğün kaydı
     (2 puan) yutar, kalan tek puanı selam (1 puan) alır; artığın tamamını
     selama vermek "38 kez selamlaştın" gibi imkânsız bir satır üretiyordu,
     çünkü selamın tavanı günde 3. */
  const rows: MonthBreakdownRow[] = []
  let spent = 0
  const push = (source: XpSource, count: number) => {
    if (count <= 0) return
    const amount = count * XP_REWARDS[source]
    rows.push({ source, amount, count })
    spent += amount
  }

  for (const { source, share } of SHARES) {
    if (source === 'meal_entry' || source === 'greeting') continue
    push(source, Math.floor((total * share) / XP_REWARDS[source]))
  }

  const remainder = total - spent
  push('meal_entry', Math.floor(remainder / XP_REWARDS.meal_entry))
  push('greeting', total - spent)
  return rows
}
