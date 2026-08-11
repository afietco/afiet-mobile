import { tierByKey, titleForLevel, type LeagueTierKey } from '@afiet/core'
import type { ApiKese } from '@/data/api/client'

/**
 * The words around the kese numbers.
 *
 * Kept apart from the components because the tone is the design here: a kese
 * that runs out is a week that ran its course, so nothing below counts down to
 * a loss, warns, or calls anything spent. It refreshes.
 */

export interface KeseSourceLine {
  key: string
  label: string
  amount: number
}

/** The breakdown, in the order the allowance is built up. Zeroes are dropped. */
export function keseSourceLines(kese: ApiKese): KeseSourceLine[] {
  const { allowance } = kese
  const lines: KeseSourceLine[] = [
    {
      key: 'tier',
      label: `${tierByKey(kese.tier as LeagueTierKey).label} sofrası`,
      amount: allowance.tier,
    },
    { key: 'title', label: `${titleForLevel(kese.level)} unvanı`, amount: allowance.title },
    { key: 'greeting', label: 'Karşılıklı selamlar', amount: allowance.greeting },
    { key: 'premium', label: 'afiet+', amount: allowance.premium },
    { key: 'welcome', label: 'Hoş geldin dolumu', amount: allowance.welcome },
  ]
  return lines.filter((line) => line.amount > 0)
}

/**
 * How far off Monday is, rounded the way a person would say it.
 *
 * Hours below a day, because "1 gün sonra" on a Sunday evening is both true
 * and useless. An unreadable timestamp falls back to naming the day, which is
 * the one part of this that is always true.
 */
export function keseRefreshLabel(refreshesAt: string, now = new Date()): string {
  const at = new Date(refreshesAt).getTime()
  if (!Number.isFinite(at)) return 'Kesen pazartesi tazelenir'

  const ms = at - now.getTime()
  if (ms <= 0) return 'Kesen birazdan tazelenir'

  const hours = Math.ceil(ms / 3_600_000)
  if (hours <= 1) return 'Kesen bir saat içinde tazelenir'
  if (hours < 24) return `Kesen ${String(hours)} saat sonra tazelenir`

  const days = Math.ceil(ms / 86_400_000)
  return `Kesen ${String(days)} gün sonra, pazartesi tazelenir`
}

/** The whole system in one line; the same sentence on every surface. */
export const KESE_ONE_LINER =
  'Ligde yükseldikçe her hafta Afi ile daha çok konuşursun.'

/** What the kese never touches, said where someone would wonder about it. */
export const KESE_OUTSIDE_NOTE =
  'Fotoğraftan besin tanıma ve besin önerisi keseden düşmez, onlar kayıt akışının parçası.'
