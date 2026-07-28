/**
 * What the "Yenilikler" sheet says, newest version first.
 *
 * Kept in step with `apps/mobile/CHANGELOG.md` when a release is cut. The two
 * are not the same text and should not be: the changelog explains a change to
 * whoever maintains the app, this explains what someone gets out of it. Written
 * in the user's language, benefit first, never a technical note.
 *
 * A version with nothing worth announcing simply has no entry here, and the
 * sheet then stays shut.
 */
export interface ReleaseNote {
  version: string
  /** Local YYYY-MM-DD. */
  date: string
  highlights: { emoji: string; text: string }[]
}

export const RELEASE_NOTES: ReleaseNote[] = [
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
