import { describe, expect, it } from 'vitest'
import {
  KESE_GREETING_CAP,
  KESE_PREMIUM_BONUS,
  KESE_TIER_BASE,
  KESE_WELCOME_GRANT,
  keseAllowance,
  keseForTier,
  keseGreetingBonus,
  keseNextRefresh,
  keseState,
  keseTitleBonus,
  keseWeekStart,
  type KeseInput,
} from './kese'

const base: KeseInput = {
  tier: 'tuz',
  level: 1,
  greetingPartners: 0,
  premium: false,
  welcome: false,
}

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
    // A second greeting to the same crowd mints nothing; this is the anti-farm rule.
    expect(keseGreetingBonus(40)).toBe(KESE_GREETING_CAP)
  })
})

describe('allowance calibration (docs/13, Orta)', () => {
  it('gives a new user ten', () => {
    expect(keseAllowance(base).total).toBe(10)
  })

  it('gives a typical active user sixteen', () => {
    expect(keseAllowance({ ...base, tier: 'nane', level: 7, greetingPartners: 2 }).total).toBe(16)
  })

  it('caps the freemium ceiling at thirty-two', () => {
    expect(
      keseAllowance({ ...base, tier: 'safran', level: 30, greetingPartners: 4 }).total,
    ).toBe(32)
  })

  it('puts premium on top of the floor and of the ceiling', () => {
    expect(keseAllowance({ ...base, premium: true }).total).toBe(70)
    expect(
      keseAllowance({
        tier: 'safran',
        level: 30,
        greetingPartners: 4,
        premium: true,
        welcome: false,
      }).total,
    ).toBe(92)
  })

  it('keeps the parts so the breakdown can be shown', () => {
    const allowance = keseAllowance({
      tier: 'kekik',
      level: 12,
      greetingPartners: 9,
      premium: true,
      welcome: true,
    })
    expect(allowance).toEqual({
      total: KESE_TIER_BASE.kekik + 2 + KESE_GREETING_CAP + KESE_PREMIUM_BONUS + KESE_WELCOME_GRANT,
      tier: 16,
      title: 2,
      greeting: 4,
      premium: KESE_PREMIUM_BONUS,
      welcome: KESE_WELCOME_GRANT,
    })
  })

  it('never lets the floor fall below Tuz, even on an unknown tier', () => {
    expect(keseAllowance({ ...base, tier: 'yok' as never }).total).toBe(KESE_TIER_BASE.tuz)
  })
})

describe('spending', () => {
  it('counts one message as one kese', () => {
    const state = keseState({ ...base, tier: 'nane', level: 7, greetingPartners: 2 }, 4)
    expect(state.remaining).toBe(12)
    expect(state.empty).toBe(false)
  })

  it('empties at the allowance and never goes negative', () => {
    expect(keseState(base, 10).remaining).toBe(0)
    expect(keseState(base, 10).empty).toBe(true)
    expect(keseState(base, 99).remaining).toBe(0)
  })
})

describe('the week boundary', () => {
  it('starts on Monday and holds through Sunday', () => {
    // 2026-08-03 is a Monday.
    expect(keseWeekStart(new Date(2026, 7, 3, 0, 0))).toBe('2026-08-03')
    expect(keseWeekStart(new Date(2026, 7, 6, 23, 59))).toBe('2026-08-03')
    expect(keseWeekStart(new Date(2026, 7, 9, 23, 59))).toBe('2026-08-03')
    expect(keseWeekStart(new Date(2026, 7, 10, 0, 1))).toBe('2026-08-10')
  })

  it('refreshes at the next Monday midnight', () => {
    const refresh = keseNextRefresh(new Date(2026, 7, 6, 14, 30))
    expect(refresh.getFullYear()).toBe(2026)
    expect(refresh.getMonth()).toBe(7)
    expect(refresh.getDate()).toBe(10)
    expect(refresh.getHours()).toBe(0)
  })
})

describe('what a tier is worth', () => {
  it('answers what climbing buys, holding level and greetings still', () => {
    const me: KeseInput = { ...base, tier: 'tuz', level: 7, greetingPartners: 2 }
    expect(keseForTier(me, 'tuz')).toBe(13)
    expect(keseForTier(me, 'nane')).toBe(16)
    // Each step is three messages: a step, not a cliff.
    expect(keseForTier(me, 'kekik') - keseForTier(me, 'nane')).toBe(3)
  })
})
