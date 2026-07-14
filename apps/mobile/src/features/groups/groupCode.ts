/**
 * 8 haneli grup ID'si — GEÇİCİ (Faz A / UI) katman.
 *
 * Kalıcı grup kimliği: büyük harf + rakamdan 8 hane (karıştırılan I/O/0/1
 * alfabede yok). Faz A'da backend'in UUID'sinden deterministik türetilir —
 * her cihazda aynı ID görünür ama backend bu ID'yi henüz tanımaz (ID ile
 * katılma Faz B'de gerçek uca bağlanır). Faz B'de kod backend'de üretilip
 * saklanır ve bu türetme kaldırılır.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function groupCodeFromId(groupId: string): string {
  let h1 = 0x811c9dc5
  let h2 = 5381
  for (let i = 0; i < groupId.length; i++) {
    const c = groupId.charCodeAt(i)
    h1 = ((h1 ^ c) * 0x01000193) >>> 0
    h2 = ((h2 * 33) ^ c) >>> 0
  }
  let out = ''
  for (let i = 0; i < 8; i++) {
    const mix = ((i % 2 === 0 ? h1 : h2) >>> ((i * 3) % 24)) ^ (i % 2 === 0 ? h2 : h1)
    out += ALPHABET[(mix >>> 0) % ALPHABET.length]
  }
  return out
}

/** Davet linki — afiet.co karşılama sayfası Faz B'de ID'yi uygulamaya taşır. */
export function inviteLink(code: string): string {
  return `https://afiet.co/katil/${code}`
}
