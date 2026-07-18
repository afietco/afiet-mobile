/**
 * Grup daveti derin bağlantısı köprüsü: afiet://katil/{code} ve
 * https://afiet.co/katil/{code} rotası (src/app/katil/[code].tsx) grup kodunu
 * buraya bırakır, Grubum ekranı tüketip koda katılma akışını çalıştırır.
 * Tek seferliktir; tüketilince temizlenir. (widget/pendingAdd.ts ile aynı desen.)
 */

/** Yalnız harf/rakam, büyük harf, 8 hane (backend'in kalıcı grup kodu biçimi). */
function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
}

let pending: string | null = null
const listeners = new Set<() => void>()

export function setPendingJoin(raw: string): void {
  const code = normalizeCode(raw)
  pending = code.length === 8 ? code : null
  for (const l of listeners) l()
}

export function consumePendingJoin(): string | null {
  const p = pending
  pending = null
  return p
}

export function onPendingJoin(l: () => void): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
