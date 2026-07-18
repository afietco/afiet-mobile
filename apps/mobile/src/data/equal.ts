/**
 * JSON-şekilli veriler (primitive, dizi, düz nesne, null) için derin eşitlik.
 * `useLive` bununla, `notify()` tetikli tazeleme AYNI veriyi döndürdüğünde
 * `setValue`'yu atlar; böylece veri değişmediğinde gereksiz re-render olmaz
 * (react-query'nin "structural sharing" davranışının küçük karşılığı).
 *
 * Repository sonuçları düz JSON'dur; Map/Set/Date/fonksiyon beklenmez ve bunlar
 * yalnızca referansla eşit sayılır (güvenli varsayılan: eşit değilse re-render).
 */
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false

  const aArr = Array.isArray(a)
  const bArr = Array.isArray(b)
  if (aArr !== bArr) return false

  if (aArr && bArr) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) if (!jsonEqual(a[i], b[i])) return false
    return true
  }

  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  const ak = Object.keys(ao)
  const bk = Object.keys(bo)
  if (ak.length !== bk.length) return false
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false
    if (!jsonEqual(ao[k], bo[k])) return false
  }
  return true
}
