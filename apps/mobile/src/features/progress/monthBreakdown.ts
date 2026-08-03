/**
 * Ay dökümünün saf mantığı; RN'den bağımsız olduğu için test edilebilir
 * (kart bileşeni react-native import ettiği anda vitest onu ayrıştıramıyor).
 */
export interface MonthBreakdownRow {
  /** Sunucunun kaynak adı; enum ileride büyüyebilir. */
  source: string
  amount: number
  count: number
}

/**
 * Sunucudaki `xp_source` enum'unun TAMAMI karşılanmalı. Enum burada bilinen
 * sekiz kaynaktan daha geniş (`quest`, `admin_adjust` de var) ve eksik bir
 * etiket satırı sessizce eledi: ekranda başlık 103 derken satırlar 63 ediyordu.
 * Yeni bir kaynak eklendiğinde de aynı şey olmasın diye tanınmayan her şey
 * aşağıda "Diğer" altında toplanıyor; artık iki sayı ayrışamaz.
 */
const LABELS: Partial<Record<string, string>> = {
  afiyet_day: 'Afiyet günlerin',
  afiyet_week: 'Afiyet haftaların',
  meal_entry: 'Öğün kayıtların',
  water_goal: 'Su hedefin',
  measurement: 'Ölçümlerin',
  greeting: 'Karşılıklı selamların',
  rainbow_week: 'Beş grubu gördüğün haftalar',
  milestone: 'Kilometre taşların',
  quest: 'Tamamladığın görevler',
  admin_adjust: 'afiet ekibinden düzeltme',
}

const OTHER_LABEL = 'Diğer'

/**
 * Satırları ekrana hazırlar. Tanınmayan kaynaklar TEK bir "Diğer" satırında
 * toplanır, elenmez: elenirse satırların toplamı başlıktaki puanı tutmaz ve
 * ekran kendi kendisiyle çelişir.
 */
export function breakdownLines(rows: MonthBreakdownRow[]): {
  key: string
  label: string
  amount: number
  count: number
}[] {
  const known: { key: string; label: string; amount: number; count: number }[] = []
  let otherAmount = 0
  let otherCount = 0

  for (const row of rows) {
    if (row.amount <= 0) continue
    const label = LABELS[row.source]
    if (label) known.push({ key: row.source, label, amount: row.amount, count: row.count })
    else {
      otherAmount += row.amount
      otherCount += row.count
    }
  }

  known.sort((a, b) => b.amount - a.amount)
  if (otherAmount > 0) {
    known.push({ key: 'other', label: OTHER_LABEL, amount: otherAmount, count: otherCount })
  }
  return known
}
