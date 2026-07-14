/**
 * Üye enerji oranları — GEÇİCİ (Faz A / UI) katman.
 *
 * Backend grup görünümü üyelerin günlük enerji verisini henüz taşımıyor.
 * UI'ı uçtan uca görebilmek için üye başına deterministik bir mock oran
 * üretilir (userId hash'i → 0.20–1.40): render'lar arasında sabittir, üyeden
 * üyeye değişir ki halkanın tüm renk aralığı ekranda görülebilsin. Faz B'de
 * gerçek oran (günün enerjisi / hedef) grup API'sine eklenir ve bu dosya
 * kaldırılır.
 */

export function mockEnergyRatio(userId: string): number {
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0
  return 0.2 + (h % 121) / 100
}

/** #rrggbb → [r,g,b] */
function rgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a)
  const [br, bg, bb] = rgb(b)
  const ch = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0')
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`
}

/**
 * Enerji halkası rengi: 0→%100 arası maviden yeşile olgunlaşır; %100 aşımında
 * turuncudan kırmızıya döner (aşım %40'ta kırmızıya doyar). Yargı değil bilgi —
 * kırmızı "ceza" değil, "bugün epey doluydu" demek.
 */
export function energyRingColor(ratio: number, isDark: boolean): string {
  if (ratio <= 1) {
    return isDark
      ? lerpColor('#60a5fa', '#34d399', ratio)
      : lerpColor('#3b82f6', '#10b981', ratio)
  }
  const t = Math.min(1, (ratio - 1) / 0.4)
  return isDark ? lerpColor('#fbbf24', '#f87171', t) : lerpColor('#f59e0b', '#ef4444', t)
}
