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

/** Source with comments removed: these assertions are about code and copy,
    and the prose beside them explains the very words they forbid. */
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')

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

  it('fills the ring from the lifetime total and never from the month', () => {
    /* `score` is this month alone. An arc drawn from it would mean something
       other than what it showed, which is why the row carries both numbers. */
    expect(ring).toContain('levelProgress(totalXp)')
    expect(code(ring)).not.toContain('score')
    expect(ring).toContain('const TIER_COLOR')
  })

  it('shares the level curve with the person own ring rather than restating it', () => {
    expect(ring).toContain("from '@afiet/core'")
    expect(ring).toContain('levelProgress')
  })

  it('names who somebody eats with, and stays silent when nobody', () => {
    expect(table).toContain('{row.groupName ? (')
    expect(code(table)).not.toContain('grubu yok')
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

describe('the public profile', () => {
  const card = read('features/social/PublicProfileCard.tsx')
  const types = read('features/social/types.ts')

  it('says who somebody is before it asks you to befriend them', () => {
    /* Opened from the standings, the card used to be a name, an emoji and a
       button, because everything readable sat behind friendship. */
    expect(card).toContain('titleForLevel(profile.level)')
    expect(card).toContain('Yaptığı sporlar')
    expect(card).toContain('joinedLine(profile.joinedOn)')
  })

  it('keeps the body on the far side of the line', () => {
    // Height, sex and activity level stay behind friendship or shared group.
    expect(card).toContain('connected && (body || profile.afiyetToday)')
    expect(types).toContain('the body and the day (energy, height, activity) stay where they were')
  })

  it('counts months rather than printing a date', () => {
    expect(card).toContain("if (months < 1) return 'Bu ay katıldı'")
    expect(card).toContain('yıldır burada')
  })

  it('drops a sport key this build does not know', () => {
    const store = read('features/social/store.ts')
    expect(store).toContain('SPORT_KEYS.has(s)')
  })
})
