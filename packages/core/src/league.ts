/**
 * Lig kademeleri ve aylık mevsim kuralları (Tur 2 oyunlaştırma katmanı).
 * Kaynak tasarım: afiet-gamification/docs/11-tur2-lig.md
 *
 * Lig puanı AYRI bir sayaç değildir: o ay kazanılan tecrübedir. Kademe
 * düşebilir ama biriken tecrübe/seviye asla azalmaz (docs/09 değişmez #1).
 */

export type LeagueTierKey = 'tuz' | 'nane' | 'kekik' | 'sumak' | 'safran'

export interface LeagueTier {
  key: LeagueTierKey
  label: string
  /** Kademe sırası; 1 en alt (zemin), 5 zirve. */
  order: number
  emoji: string
}

/** Baharat yolu; metal (bronz/altın) yerine bilinçli olarak mutfaktan. */
export const LEAGUE_TIERS: readonly LeagueTier[] = [
  { key: 'tuz', label: 'Tuz', order: 1, emoji: '🧂' },
  { key: 'nane', label: 'Nane', order: 2, emoji: '🌿' },
  { key: 'kekik', label: 'Kekik', order: 3, emoji: '🍃' },
  { key: 'sumak', label: 'Sumak', order: 4, emoji: '🌺' },
  { key: 'safran', label: 'Safran', order: 5, emoji: '🌼' },
]

/** Sofra (kohort) hedef boyu. */
export const LEAGUE_TABLE_SIZE = 25
/** Tabanın ikiye bölünmeye başladığı uygun kullanıcı sayısı. */
export const LEAGUE_SPLIT_THRESHOLD = 50
/** Yükselen ve düşen dilim oranı. */
export const LEAGUE_CUT_RATIO = 0.2

export function tierByKey(key: LeagueTierKey): LeagueTier {
  return LEAGUE_TIERS.find((tier) => tier.key === key) ?? LEAGUE_TIERS[0]!
}

/** Zemin kademe: buradan düşülmez, ilk mevsim bu yüzden doğal olarak düşmesizdir. */
export function isFloorTier(key: LeagueTierKey): boolean {
  return tierByKey(key).order === 1
}

export function isTopTier(key: LeagueTierKey): boolean {
  return tierByKey(key).order === LEAGUE_TIERS.length
}

export function tierAbove(key: LeagueTierKey): LeagueTier | null {
  const order = tierByKey(key).order
  return LEAGUE_TIERS.find((tier) => tier.order === order + 1) ?? null
}

export function tierBelow(key: LeagueTierKey): LeagueTier | null {
  const order = tierByKey(key).order
  return LEAGUE_TIERS.find((tier) => tier.order === order - 1) ?? null
}

/** Ay sonunda bir sıranın akıbeti. */
export type LeagueOutcome = 'promote' | 'stay' | 'demote'

/** Yükselme diliminin büyüklüğü (en az 1 kişi, sofra doluysa oransal). */
export function promotionCount(tableSize: number): number {
  if (tableSize <= 1) return 0
  return Math.max(1, Math.round(tableSize * LEAGUE_CUT_RATIO))
}

/** Düşme diliminin büyüklüğü; zemin kademede sıfırdır. */
export function relegationCount(tableSize: number, tier: LeagueTierKey): number {
  if (isFloorTier(tier) || tableSize <= 1) return 0
  return Math.max(1, Math.round(tableSize * LEAGUE_CUT_RATIO))
}

/**
 * 1'den başlayan sıraya göre akıbet. Zirvede yükselme yerine "kal" döner,
 * zeminde düşme yerine "kal" döner.
 */
export function outcomeForRank(
  rank: number,
  tableSize: number,
  tier: LeagueTierKey,
): LeagueOutcome {
  const promote = isTopTier(tier) ? 0 : promotionCount(tableSize)
  const demote = relegationCount(tableSize, tier)
  if (rank <= promote) return 'promote'
  if (rank > tableSize - demote) return 'demote'
  return 'stay'
}

/** Ayın son gününün sonu (yerel); geri sayım bunu kullanır. */
export function seasonEnd(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
}

/** Mevsim adı: "Temmuz 2026". */
export function seasonLabel(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(date)
}
