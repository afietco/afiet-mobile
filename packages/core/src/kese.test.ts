import { describe, expect, it } from 'vitest'
import {
  KESE_GREETING_CAP,
  KESE_PREMIUM_BONUS,
  KESE_TIER_BASE,
  KESE_WELCOME_GRANT,
  keseGreetingBonus,
  keseTitleBonus,
  keseTotalForTier,
  type KeseAllowance,
} from './kese'

/**
 * The calibration table from docs/13. The server composes the totals and its
 * own suite pins them (internal/progress/kese_test.go); what is pinned here is
 * the table both sides build from, so an edit on one side fails on that side.
 */
describe('the calibration table', () => {
  it('walks the spice road in steps of three, never below ten', () => {
    expect(KESE_TIER_BASE).toEqual({ tuz: 10, nane: 13, kekik: 16, sumak: 19, safran: 22 })
  })

  it('holds the bonuses docs/13 fixed', () => {
    expect(KESE_GREETING_CAP).toBe(4)
    expect(KESE_PREMIUM_BONUS).toBe(60)
    expect(KESE_WELCOME_GRANT).toBe(25)
  })
})

describe('title bonus', () => {
  it('adds one per five-level band, from zero at Yeni Sofra to six at Sofra Piri', () => {
    expect(keseTitleBonus(1)).toBe(0)
    expect(keseTitleBonus(4)).toBe(0)
    expect(keseTitleBonus(5)).toBe(1)
    expect(keseTitleBonus(7)).toBe(1)
    expect(keseTitleBonus(10)).toBe(2)
    expect(keseTitleBonus(30)).toBe(6)
  })

  it('stays at the top bonus beyond the last band', () => {
    expect(keseTitleBonus(99)).toBe(6)
  })
})

describe('greeting bonus', () => {
  it('pays one per partner and stops at the weekly cap', () => {
    expect(keseGreetingBonus(0)).toBe(0)
    expect(keseGreetingBonus(3)).toBe(3)
    expect(keseGreetingBonus(4)).toBe(KESE_GREETING_CAP)
    // A second greeting to the same crowd mints nothing: the anti-farm rule.
    expect(keseGreetingBonus(40)).toBe(KESE_GREETING_CAP)
  })
})

describe('what another tier would be worth', () => {
  // A typical active week: Nane, level 7, two mutual greetings.
  const allowance: KeseAllowance = {
    total: 16,
    tier: 13,
    title: 1,
    greeting: 2,
    premium: 0,
    welcome: 0,
  }

  it('swaps only the tier portion, holding level and greetings still', () => {
    expect(keseTotalForTier(allowance, 'nane')).toBe(16)
    expect(keseTotalForTier(allowance, 'kekik')).toBe(19)
    expect(keseTotalForTier(allowance, 'tuz')).toBe(13)
  })

  it('keeps every step three messages wide: a step, not a cliff', () => {
    expect(keseTotalForTier(allowance, 'sumak') - keseTotalForTier(allowance, 'kekik')).toBe(3)
  })

  it('falls back to the floor for a tier it does not know', () => {
    expect(keseTotalForTier(allowance, 'yok' as never)).toBe(13)
  })
})
