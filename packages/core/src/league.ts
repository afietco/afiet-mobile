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

/** One row of the standings, reduced to what a gap calculation needs. */
export interface LeagueStanding {
  rank: number
  score: number
}

/**
 * Points still needed to reach the promotion zone, or null when the question
 * does not apply: nobody is promoted from this table, or the person is already
 * inside the zone.
 *
 * Deliberately one-directional. The distance to the relegation line is exactly
 * as computable and is never returned, because naming it is the loss language
 * docs/09 invariant #2 rules out; the screen only ever looks up.
 *
 * The gap is measured against the score currently holding the last promotable
 * rank, so it is what a person would have to match TODAY. Matching it does not
 * guarantee the rank (the other person keeps playing too), which is why the
 * copy around this says "at least".
 */
export function promotionGap(
  rows: LeagueStanding[],
  promote: number,
  myRank: number,
  myScore: number,
): number | null {
  if (promote <= 0 || myRank <= promote) return null
  const lastPromoted = rows.find((row) => row.rank === promote)
  if (!lastPromoted) return null
  const gap = lastPromoted.score - myScore
  return gap > 0 ? gap : null
}

/**
 * The few rows worth showing when the whole table would be a wall of names.
 *
 * A twenty-five row list of people scoring zero is mostly empty space; what
 * somebody actually reads is who is just ahead and who is just behind. This
 * returns that neighbourhood, keeping the requested size even at the edges:
 * first place has nobody above, so it takes two from below instead of showing
 * a short list.
 *
 * Order is preserved, so the caller can render it as a slice of the table it
 * came from.
 */
export function standingsWindow<T extends LeagueStanding>(
  rows: T[],
  myRank: number,
  size = 3,
): T[] {
  if (rows.length <= size) return rows
  const index = rows.findIndex((row) => row.rank === myRank)
  if (index < 0) return rows.slice(0, size)

  /* Centre on me, then slide back inside the table. Clamping after centring is
     what keeps the window full at both ends. */
  const half = Math.floor(size / 2)
  const start = Math.min(Math.max(index - half, 0), rows.length - size)
  return rows.slice(start, start + size)
}
