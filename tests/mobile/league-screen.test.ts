import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The league stopped being a scoreboard with a purse attached.
 *
 * What the ladder was FOR used to be answered on the screen itself, by a card
 * counting Afi messages, with an afiet+ row under it. Both left; the explainer
 * behind the header button carries the meaning now, and the rows became people
 * you can open rather than lines of text.
 */
const read = (rel: string) =>
  readFileSync(new URL(`../../apps/mobile/src/${rel}`, import.meta.url), 'utf8')

const screen = read('app/lig/index.tsx')
const standings = read('app/lig/siralama.tsx')
const guide = read('app/lig/rehber.tsx')
const table = read('features/progress/LeagueTable.tsx')
const ring = read('features/progress/TierRing.tsx')

describe('the league screen', () => {
  it('no longer counts a purse or sells anything', () => {
    expect(screen).not.toContain('useKese')
    expect(screen).not.toContain('usePremium')
    expect(screen).not.toContain('afiet+')
    expect(screen).not.toMatch(/Haftada .* mesaj/)
  })

  it('puts the explainer in the header, where a question is asked', () => {
    expect(screen).toContain('accessibilityLabel="Lig nasıl işler"')
    expect(screen).toContain("router.push('/lig/rehber')")
  })

  it('lets a row open its person instead of swallowing the tap', () => {
    /* The neighbourhood used to be one big button to the standings, so a row
       inside it could never open anybody. */
    expect(screen).toContain('<View className="mt-3 rounded-2xl bg-surface p-3">')
    expect(screen).toContain("router.push('/lig/siralama')")
  })
})

describe('a standings row', () => {
  it('is a person, and opens them', () => {
    expect(table).toContain('openPublicProfile(row.userId)')
    expect(table).toContain('accessibilityRole="button"')
  })

  it('carries the level on a ring rather than a badge under the name', () => {
    expect(table).toContain('<TierRing')
    expect(table).not.toContain('LevelBadge')
  })

  it('draws a closed ring, because the fill would be a number it does not have', () => {
    /* The row carries this month's points, not a lifetime total, so an arc
       drawn from it would mean something other than what it showed. */
    expect(ring).toContain('strokeWidth={2.6}')
    expect(ring).not.toContain('strokeDashoffset')
    expect(ring).toContain('const TIER_COLOR')
  })

  it('is used with its tier in both places a table appears', () => {
    expect(screen).toContain('<LeagueRow row={row} tier={tier.key} />')
    expect(standings).toContain('<LeagueRow row={row} tier={tier.key} />')
  })
})

describe('the league guide', () => {
  it('answers the four questions in the order they get asked', () => {
    expect(guide.indexOf('Beş sofra')).toBeGreaterThan(-1)
    expect(guide.indexOf('Ay nasıl geçer?')).toBeGreaterThan(guide.indexOf('Beş sofra'))
    expect(guide.indexOf('Puan nasıl kazanılır?')).toBeGreaterThan(guide.indexOf('Ay nasıl geçer?'))
    expect(guide.indexOf('Ne korunur, ne sıfırlanır?')).toBeGreaterThan(
      guide.indexOf('Puan nasıl kazanılır?'),
    )
  })

  it('reads the ladder from the rules rather than restating them by hand', () => {
    expect(guide).toContain('LEAGUE_TIERS')
    expect(guide).toContain('LEAGUE_TABLE_SIZE')
    expect(guide).toContain('LEAGUE_CUT_RATIO')
  })

  it('states the ladder as fact and never tells anybody they are behind', () => {
    expect(guide).not.toMatch(/geride|düşüyorsun|kaybediyorsun|dikkat/i)
    expect(guide).toContain('Seviyen ve unvanın sende kalır')
  })

  it('keeps the copy free of the em dash', () => {
    expect(guide).not.toContain(String.fromCharCode(0x2014))
    expect(table).not.toContain(String.fromCharCode(0x2014))
  })
})
