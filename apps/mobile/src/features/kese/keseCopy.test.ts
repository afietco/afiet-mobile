import { keseState } from '@afiet/core'
import { describe, expect, it } from 'vitest'
import { keseRefreshLabel, keseSourceLines } from './keseCopy'

describe('source lines', () => {
  it('names the tier and the title the allowance came from', () => {
    const kese = keseState(
      { tier: 'nane', level: 7, greetingPartners: 2, premium: false, welcome: false },
      4,
    )
    expect(keseSourceLines(kese)).toEqual([
      { key: 'tier', label: 'Nane sofrası', amount: 13 },
      { key: 'title', label: 'Denge Yolcusu unvanı', amount: 1 },
      { key: 'greeting', label: 'Karşılıklı selamlar', amount: 2 },
    ])
  })

  it('drops the parts that contributed nothing', () => {
    const kese = keseState(
      { tier: 'tuz', level: 1, greetingPartners: 0, premium: false, welcome: false },
      0,
    )
    expect(keseSourceLines(kese).map((line) => line.key)).toEqual(['tier'])
  })
})

describe('refresh label', () => {
  const monday = new Date(2026, 7, 10, 0, 0)

  it('counts in days while Monday is far', () => {
    expect(keseRefreshLabel(monday, new Date(2026, 7, 6, 12, 0))).toBe(
      'Kesen 4 gün sonra, pazartesi tazelenir',
    )
  })

  it('switches to hours inside the last day', () => {
    expect(keseRefreshLabel(monday, new Date(2026, 7, 9, 18, 0))).toBe(
      'Kesen 6 saat sonra tazelenir',
    )
  })

  it('never counts down past the refresh', () => {
    expect(keseRefreshLabel(monday, new Date(2026, 7, 10, 0, 1))).toBe(
      'Kesen birazdan tazelenir',
    )
  })
})
