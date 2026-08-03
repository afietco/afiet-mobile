/**
 * What the "Yenilikler" sheet says, newest version first.
 *
 * Kept in step with `apps/mobile/CHANGELOG.md` when a release is cut. The two
 * are not the same text and should not be: the changelog explains a change to
 * whoever maintains the app, this explains what someone gets out of it. Written
 * in the user's language, benefit first, never a technical note.
 *
 * Every release gets an entry: the release flow refuses to cut a version whose
 * changelog is empty, so a version with nothing to announce does not happen.
 * The sheet still survives a missing entry by staying shut rather than opening
 * empty, because that is cheaper than a release blocked on a forgotten file.
 *
 * There is a third telling of the same release, longer than both: the page at
 * afiet.co/yenilikler/<version>, which the sheet links to. It is published
 * from the web repo BEFORE the tag is cut (see .claude/skills/release), so the
 * link is never ahead of the page.
 */

/** Where the long version of these notes lives. */
export const RELEASE_NOTES_URL = 'https://afiet.co/yenilikler'

export function releaseNotesUrl(version: string): string {
  return `${RELEASE_NOTES_URL}/${version}`
}
export interface ReleaseNote {
  version: string
  /** Local YYYY-MM-DD. */
  date: string
  highlights: { emoji: string; text: string }[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '0.11.1',
    date: '2026-08-03',
    highlights: [
      {
        emoji: '🐛',
        text: 'Uygulamanın komple kapanmasına yol açan çökme giderildi: menüden Yapay Zeka Merkezi\'ne geçerken ve Afi yazarken sohbet listesini kapatırken artık kapanmıyor',
      },
    ],
  },
  {
    version: '0.11.0',
    date: '2026-08-03',
    highlights: [
      {
        emoji: '📊',
        text: 'Bilgilerim\'e Değerler sekmesi geldi: son 30 gününün enerjisi, makro dağılımı ve denge takvimi bir arada',
      },
      {
        emoji: '🏅',
        text: 'Lig artık kendini anlatıyor: sofranın kaç mesaj ettiği, yükselmeye kalan puan ve neyin kaç puan getirdiği yazıyor',
      },
      {
        emoji: '🗓️',
        text: 'Profiline mevsim rafı geldi; her ayı hangi sofrada bitirdiğin kalıcı olarak duruyor',
      },
      {
        emoji: '⚡',
        text: 'Açılış hızlandı ve artık iskelet yerine son gördüğün veriyle açılıyor',
      },
      {
        emoji: '🔔',
        text: 'Mağazada yeni bir sürüm çıktığında uygulama bunu kendisi söylüyor',
      },
    ],
  },
  {
    version: '0.10.0',
    date: '2026-08-01',
    highlights: [
      {
        emoji: '💬',
        text: 'Sohbet geldi: Afi ile serbest sohbet, haftanı değerlendiren beslenme sohbeti ve yemekle ilişkin için destek sohbeti',
      },
      {
        emoji: '🔒',
        text: 'Yazışmaların yalnız cihazında duruyor ve destek sohbetine hiçbir yemek kaydın gitmiyor',
      },
      {
        emoji: '🎫',
        text: 'Kullanıcı adı kalktı: artık değişmeyen bir arkadaş kodun var, tek dokunuşla paylaşıyorsun',
      },
      {
        emoji: '✉️',
        text: 'Giriş, kayıt ve şifre sıfırlama artık yalnız e-postayla; "bu ad alınmış" derdi bitti',
      },
    ],
  },
  {
    version: '0.9.0',
    date: '2026-07-31',
    highlights: [
      {
        emoji: '🍽️',
        text: 'Sofra geldi: birlikte yediklerini bir arada kaydediyorsun, besin eklerken hepsi tek dokunuşla geliyor',
      },
      {
        emoji: '📖',
        text: 'Besin Rehberi gezilebiliyor: gruba, öğüne, türe ve beslenme türüne göre süzüyorsun',
      },
      {
        emoji: '👥',
        text: 'Herkese açık grupları arayıp katılabiliyorsun; kod yalnız kodu olana lazım',
      },
      {
        emoji: '👆',
        text: 'Sekmeler kaydırarak da geçiliyor ve görevlere dokununca Afi neyi saydığını anlatıyor',
      },
      {
        emoji: '🔓',
        text: 'Tanışma rehberinde takılıp alt menüsü kilitlenenler güncellemeyle kurtuluyor',
      },
    ],
  },
  {
    version: '0.8.1',
    date: '2026-07-28',
    highlights: [
      {
        emoji: '🧀',
        text: 'Besin ararken artık aradığın şey geliyor: "peynir" yazınca peynirli börek değil, beyaz peynir de kaşar da listede',
      },
      {
        emoji: '🍽️',
        text: 'Bir besin kaydettikten sonra aynı öğüne bir tane daha ekleyebiliyorsun; öğünü baştan seçmek yok',
      },
      {
        emoji: '⌨️',
        text: 'Yazman bitince klavye kendi kapanıyor, ekranın yarısını örtüp kalmıyor',
      },
      {
        emoji: '👥',
        text: 'Herkese açık gruplar yeni hesapta da görünüyor; getirilemezse sana söylüyor ve tekrar deneyebiliyorsun',
      },
      {
        emoji: '🍏',
        text: 'Apple ve Google ile kaydolmak tek dokunuş: kullanıcı adını sonradan koyabiliyorsun',
      },
    ],
  },
  {
    version: '0.8.0',
    date: '2026-07-28',
    highlights: [
      {
        emoji: '🎯',
        text: 'Kurulumda Afi yönünü soruyor ve ölçülerin ilk günden sana göre kuruluyor',
      },
      {
        emoji: '📐',
        text: 'Makro hedeflerin artık senin vücudunla hesaplanıyor; mezura ölçünü girersen yağsız kütlenden',
      },
      {
        emoji: '✨',
        text: 'Besin eklemek tek düğmeden yürüyen üç adımlı bir akış oldu, Afi her adımda yanında',
      },
      {
        emoji: '💛',
        text: 'Vücudum\'da "Afi seni ne kadar tanıyor" göstergesi: eksik olanı yargılamadan davet ediyor',
      },
    ],
  },
]

/** The note for a version, or undefined when that release had nothing to say. */
export function releaseNoteFor(version: string | null | undefined): ReleaseNote | undefined {
  if (!version) return undefined
  return RELEASE_NOTES.find((note) => note.version === version)
}

/**
 * Whether the sheet should open by itself.
 *
 * Three states have to stay apart. A fresh install has no "new" to speak of,
 * so it is marked as seen without ever showing anything. Someone who has seen
 * this version is done. And a version we wrote no notes for stays quiet rather
 * than opening an empty sheet.
 */
export function shouldAnnounce(input: {
  version: string | null | undefined
  lastSeen: string | null
  hasProfile: boolean
}): boolean {
  if (!input.version || !input.hasProfile) return false
  if (input.lastSeen === input.version) return false
  return releaseNoteFor(input.version) !== undefined
}
