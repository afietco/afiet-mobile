/**
 * UUID ↔ yerel numara köprüsü. @afiet/core repository arayüzleri numeric id
 * kullanır (web'in Dexie autoincrement modelinden gelir, web ile PAYLAŞILIR —
 * bu yüzden core'a dokunmuyoruz). Backend ise UUID kullanır. Bu kayıt defteri
 * her API kaydına oturum-yerel kararlı bir numara verir; UI o numarayı görür,
 * silme/güncelleme UUID'ye geri çevrilir.
 *
 * Kararlılık: aynı UUID oturum boyunca hep aynı numarayı alır (React key'leri
 * için önemli). Liste sorguları defteri doldurur; UI yalnız listelediği kaydı
 * sildiğinden defter her zaman sıcaktır. Uygulama yeniden başlarsa defter
 * sıfırlanır (numaralar yeniden atanır) — sorun değil, ekranlar sıfırdan çizilir.
 */
let counter = 0
const numByUuid = new Map<string, number>()
const uuidByNum = new Map<number, string>()

/** UUID'nin kararlı yerel numarasını döner (yoksa atar). */
export function toNum(uuid: string): number {
  let n = numByUuid.get(uuid)
  if (n === undefined) {
    n = ++counter
    numByUuid.set(uuid, n)
    uuidByNum.set(n, uuid)
  }
  return n
}

/** Yerel numaranın UUID'sini döner (bilinmiyorsa undefined). */
export function toUuid(n: number): string | undefined {
  return uuidByNum.get(n)
}

/** Clears every user-scoped identifier when the active session ends. */
export function resetIdMap(): void {
  counter = 0
  numByUuid.clear()
  uuidByNum.clear()
}
