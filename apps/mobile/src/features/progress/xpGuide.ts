/**
 * What each thing is worth, in words.
 *
 * The league screen told people their score was "experience earned from afiyet
 * days and records" and stopped there, which is a ladder with the rungs
 * painted out: you can see you are climbing but not how. The numbers were
 * already fixed in @afiet/core, they simply never reached a screen.
 *
 * Every line carries its ceiling. A dictionary that says "a meal is worth 2"
 * without saying "three a day count" is not shorter, it is wrong: somebody
 * logging fifty meals would expect a hundred points and receive six. The
 * ceiling is the "hacim kazanmaz" invariant (docs/09 #4) and it is the part
 * that keeps this honest.
 *
 * `milestone` is left out: it is the quest reward, quests have their own
 * screen that names it, and listing it here would read as a fifth way to farm.
 */
import { XP_CAP_WINDOW, XP_CAPS, XP_REWARDS, type XpSource } from '@afiet/core'

export interface XpGuideLine {
  source: XpSource
  label: string
  /** Points for one occurrence. */
  amount: number
  /** How often it counts, already worded. Empty when once is all there is. */
  limit: string
}

/** Shown in the order somebody meets them, not by size. */
const ORDER: { source: XpSource; label: string }[] = [
  { source: 'afiyet_day', label: 'Afiyet günü' },
  { source: 'meal_entry', label: 'Öğün kaydı' },
  { source: 'water_goal', label: 'Su hedefini tutturmak' },
  { source: 'measurement', label: 'Ölçüm girmek' },
  { source: 'greeting', label: 'Karşılıklı selam' },
  { source: 'afiyet_week', label: 'Afiyet haftası' },
  { source: 'rainbow_week', label: 'Beş grubu da gördüğün hafta' },
]

function limitOf(source: XpSource): string {
  const cap = XP_CAPS[source]
  const window = XP_CAP_WINDOW[source] === 'week' ? 'hafta' : 'gün'
  if (cap <= 1) return window === 'hafta' ? 'haftada bir' : 'günde bir'
  return `${window === 'hafta' ? 'haftada' : 'günde'} en fazla ${cap}`
}

export function xpGuideLines(): XpGuideLine[] {
  return ORDER.map(({ source, label }) => ({
    source,
    label,
    amount: XP_REWARDS[source],
    limit: limitOf(source),
  }))
}

/** The sentence that says what the score is, before the table of parts. */
export const XP_GUIDE_INTRO =
  'Lig puanın, bu ay kazandığın tecrübedir. Aynı tecrübe seviyeni de büyütür; ay bitince lig puanı sıfırlanır, seviyen ve unvanın kalır.'
