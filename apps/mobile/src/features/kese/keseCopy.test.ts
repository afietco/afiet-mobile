import { describe, expect, it } from 'vitest'
import type { ApiKese } from '@/data/api/client'
import { keseRefreshLabel, keseSourceLines } from './keseCopy'

/** A typical active week as the server reports it: Nane, level 7, two greetings. */
const kese: ApiKese = {
  enabled: true,
  allowance: { total: 16, tier: 13, title: 1, greeting: 2, premium: 0, welcome: 0 },
  spent: 4,
  remaining: 12,
  empty: false,
  weekStart: '2026-08-03',
  refreshesAt: '2026-08-10T00:00:00+03:00',
  tier: 'nane',
  level: 7,
  premium: false,
}

describe('source lines', () => {
  it('names the tier and the title the allowance came from', () => {
    expect(keseSourceLines(kese)).toEqual([
      { key: 'tier', label: 'Nane sofrası', amount: 13 },
      { key: 'title', label: 'Denge Yolcusu unvanı', amount: 1 },
      { key: 'greeting', label: 'Karşılıklı selamlar', amount: 2 },
    ])
  })

  it('drops the parts that contributed nothing', () => {
    const floor: ApiKese = {
      ...kese,
      allowance: { total: 10, tier: 10, title: 0, greeting: 0, premium: 0, welcome: 0 },
      tier: 'tuz',
      level: 1,
    }
    expect(keseSourceLines(floor).map((line) => line.key)).toEqual(['tier'])
  })
})

describe('refresh label', () => {
  const monday = '2026-08-10T00:00:00+03:00'

  it('counts in days while Monday is far', () => {
    expect(keseRefreshLabel(monday, new Date('2026-08-06T12:00:00+03:00'))).toBe(
      'Kesen 4 gün sonra, pazartesi tazelenir',
    )
  })

  it('switches to hours inside the last day', () => {
    expect(keseRefreshLabel(monday, new Date('2026-08-09T18:00:00+03:00'))).toBe(
      'Kesen 6 saat sonra tazelenir',
    )
  })

  it('never counts down past the refresh', () => {
    expect(keseRefreshLabel(monday, new Date('2026-08-10T00:01:00+03:00'))).toBe(
      'Kesen birazdan tazelenir',
    )
  })

  // An older server, or none at all, must not put "Invalid Date" on screen.
  it('falls back to the day when the timestamp is unreadable', () => {
    expect(keseRefreshLabel('')).toBe('Kesen pazartesi tazelenir')
  })
})
