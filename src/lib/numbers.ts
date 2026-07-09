/** Virgül toleranslı sayı ayrıştırma (Türkçe klavye ondalıkta virgül üretir) */
export function parseDecimal(s: string): number | null {
  const n = Number(s.trim().replace(',', '.'))
  return Number.isFinite(n) && s.trim() !== '' ? n : null
}

/** Sayıyı Türkçe yazımla metne çevirir — ondalık ayracı virgül */
export function formatDecimalTR(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',')
}
