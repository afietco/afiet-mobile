/**
 * Tecrübe, seviye ve unvan matematiği (Tur 2 oyunlaştırma katmanı).
 * Kaynak tasarım: afiet-gamification/docs/10-tur2-tecrube-seviye.md
 *
 * Saf ve platformdan bağımsız: aynı eğri ileride backend tarafında da
 * uygulanacağı için tek doğruluk kaynağı burasıdır. Değişmez kural:
 * tecrübe ASLA azalmaz, dolayısıyla seviye de asla geri gitmez.
 *
 * Eğri:  bir sonraki seviyenin maliyeti(n) = 40 + 20n   (n: mevcut seviye)
 *        N seviyesine toplam eşik           = 10N² + 30N - 40
 */

/** Tecrübe kaynakları; backend defterindeki (xp_events.source) enum ile eşleşir. */
export type XpSource =
  | 'afiyet_day'
  | 'afiyet_week'
  | 'meal_entry'
  | 'water_goal'
  | 'measurement'
  | 'greeting'
  | 'rainbow_week'
  | 'milestone'

/** Kaynak başına kazanç ve günlük/haftalık tavan (hacim kazanmaz kuralı). */
export const XP_REWARDS: Record<XpSource, number> = {
  afiyet_day: 20,
  afiyet_week: 60,
  meal_entry: 2,
  water_goal: 5,
  measurement: 10,
  greeting: 1,
  rainbow_week: 20,
  milestone: 10,
}

/**
 * Kaynak başına PENCERE TAVANI; "hacim kazanmaz" değişmezinin (docs/09 #4)
 * sayısal hâli. Pencere kaynağın kendi ritmidir: günlük kaynaklarda gün,
 * haftalıklarda hafta.
 *
 * Backend'deki `internal/progress.Cap` ile BİREBİR aynı olmalı ve iki taraf da
 * kendi testiyle sabitlenir. Burada olmasının sebebi tek: uygulama puan
 * sözlüğünü bu tablodan yazıyor ve tavanı söylemeyen bir sözlük yanlış vaat
 * verir (50 öğün kaydeden biri 100 puan beklerdi, 6 alır).
 */
export const XP_CAPS: Record<XpSource, number> = {
  afiyet_day: 1,
  afiyet_week: 1,
  meal_entry: 3,
  water_goal: 1,
  measurement: 1,
  greeting: 3,
  rainbow_week: 1,
  milestone: 1,
}

/** Tavanın hangi pencerede geçerli olduğu; sözlük cümlesini bu belirler. */
export const XP_CAP_WINDOW: Record<XpSource, 'day' | 'week'> = {
  afiyet_day: 'day',
  afiyet_week: 'week',
  meal_entry: 'day',
  water_goal: 'day',
  measurement: 'day',
  greeting: 'day',
  rainbow_week: 'week',
  milestone: 'day',
}

/** Seviye bandı; her bant 5 seviye taşır ve bir unvan adı verir. */
export interface TitleBand {
  /** Bandın başladığı seviye. */
  minLevel: number
  title: string
}

/**
 * Unvan bantları. Tur 1'deki hafta eşikli unvanlar (4/12/24 afiyet haftası)
 * bu merdivene taşındı; iki ayrı statü sistemi yaşatılmaz.
 */
export const TITLE_BANDS: readonly TitleBand[] = [
  { minLevel: 1, title: 'Yeni Sofra' },
  { minLevel: 5, title: 'Denge Yolcusu' },
  { minLevel: 10, title: 'Sofra Dostu' },
  { minLevel: 15, title: 'Sofra Ehli' },
  { minLevel: 20, title: 'Sofra Ustası' },
  { minLevel: 25, title: 'Lezzet Ustası' },
  { minLevel: 30, title: 'Sofra Piri' },
]

/** Seviye 1'den N'e ulaşmak için gereken toplam tecrübe. */
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0
  return 10 * level * level + 30 * level - 40
}

/** Mevcut seviyeden bir sonrakine geçmenin maliyeti. */
export function xpCostForNextLevel(level: number): number {
  return 40 + 20 * Math.max(1, level)
}

/** Toplam tecrübeden seviye. Seviye 1'den başlar, üst sınır yoktur. */
export function levelFromXp(totalXp: number): number {
  const xp = Math.max(0, Math.floor(totalXp))
  let level = 1
  while (totalXpForLevel(level + 1) <= xp) level += 1
  return level
}

/** Seviyenin unvanı; bant tablosundaki en yüksek uygun kayıt. */
export function titleForLevel(level: number): string {
  let title = TITLE_BANDS[0]?.title ?? ''
  for (const band of TITLE_BANDS) {
    if (level >= band.minLevel) title = band.title
  }
  return title
}

export interface LevelProgress {
  level: number
  title: string
  totalXp: number
  /** Mevcut seviyenin içinde kazanılmış tecrübe. */
  xpIntoLevel: number
  /** Bu seviyeden sonrakine geçmek için gereken toplam tecrübe. */
  xpForLevel: number
  /** Sonraki seviyeye kalan. */
  xpToNext: number
  /** 0..1 arası ilerleme; halka ve çubuk bunu kullanır. */
  ratio: number
}

/** Tek çağrıda arayüzün ihtiyaç duyduğu bütün ilerleme alanları. */
export function levelProgress(totalXp: number): LevelProgress {
  const xp = Math.max(0, Math.floor(totalXp))
  const level = levelFromXp(xp)
  const floor = totalXpForLevel(level)
  const xpForLevel = xpCostForNextLevel(level)
  const xpIntoLevel = xp - floor
  const xpToNext = Math.max(0, xpForLevel - xpIntoLevel)
  return {
    level,
    title: titleForLevel(level),
    totalXp: xp,
    xpIntoLevel,
    xpForLevel,
    xpToNext,
    ratio: xpForLevel > 0 ? Math.min(1, xpIntoLevel / xpForLevel) : 0,
  }
}

/** Bir sonraki unvana kaç seviye kaldığı; zirvedeyse null. */
export function levelsToNextTitle(level: number): number | null {
  const next = TITLE_BANDS.find((band) => band.minLevel > level)
  return next ? next.minLevel - level : null
}
