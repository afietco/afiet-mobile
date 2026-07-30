import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  collectAfiMoments,
  type AfiMoment,
  type AfiMomentInput,
} from '@/features/home/afiMoment'

const homeUrl = new URL('../../apps/mobile/src/app/(tabs)/index.tsx', import.meta.url)
const noteUrl = new URL('../../apps/mobile/src/features/home/AfiTodayNote.tsx', import.meta.url)

/** Mid-afternoon, two meals in, one core group still missing, water done. */
const day = (over: Partial<AfiMomentInput> = {}): AfiMomentInput => ({
  hour: 13,
  mealsToday: 2,
  missingGroups: ['sebze'],
  sweetCount: 0,
  fastfoodCount: 0,
  waterGlasses: 8,
  waterTarget: 8,
  streak: 0,
  daysSinceMeasurement: 0,
  neverLogged: false,
  ...over,
})

const momentsOf = (over: Partial<AfiMomentInput> = {}) => collectAfiMoments(day(over))
const keysOf = (over: Partial<AfiMomentInput> = {}) => momentsOf(over).map((m) => m.key)
const lineOf = (key: string, over: Partial<AfiMomentInput> = {}) =>
  momentsOf(over).find((m) => m.key === key)?.line ?? ''

describe('Afi on Today: what is true right now', () => {
  it('stands down before the first ever record, where the hero card already has Afi', () => {
    expect(collectAfiMoments(day({ neverLogged: true }))).toEqual([])
    // Even in a state that would otherwise celebrate.
    expect(collectAfiMoments(day({ neverLogged: true, missingGroups: [] }))).toEqual([])
  })

  it('leads with a complete plate and says so once, not twice', () => {
    expect(keysOf({ missingGroups: [], waterGlasses: 3 })[0]).toBe('denge-tamam')
    expect(keysOf({ missingGroups: [] })[0]).toBe('denge-ve-su')
    // A complete plate rules out the gap note by construction.
    expect(keysOf({ missingGroups: [] })).not.toContain('denge-eksik')
  })

  it('keeps company at night and asks for nothing', () => {
    expect(keysOf({ hour: 23 })).toContain('gece-dolu')
    expect(keysOf({ hour: 2 })).toContain('gece-dolu')
    expect(keysOf({ hour: 23, mealsToday: 0 })).toEqual(['gece-sessiz'])

    for (const moment of momentsOf({ hour: 23, waterGlasses: 0 })) {
      expect(moment.action, moment.key).toBeNull()
    }
    // Nothing is asked at night: no plate, water or sweet-day note.
    expect(keysOf({ hour: 23, waterGlasses: 0, sweetCount: 3 })).toEqual(['gece-dolu'])
  })

  it('puts the night boundary at 22:00 and 05:00', () => {
    expect(keysOf({ hour: 21, mealsToday: 0 })).toContain('sofra-bekliyor')
    expect(keysOf({ hour: 22, mealsToday: 0 })).toEqual(['gece-sessiz'])
    expect(keysOf({ hour: 4, mealsToday: 0 })).toEqual(['gece-sessiz'])
    expect(keysOf({ hour: 5, mealsToday: 0 })).toContain('gunaydin')
  })

  it('greets the morning and invites the rest of the day', () => {
    expect(keysOf({ hour: 8, mealsToday: 0 })).toContain('gunaydin')
    expect(keysOf({ hour: 11, mealsToday: 0 })).toContain('gunaydin')
    expect(keysOf({ hour: 12, mealsToday: 0 })).toContain('sofra-bekliyor')
    expect(momentsOf({ hour: 8, mealsToday: 0 })[0]?.action).toBe('meal')
    // An empty table is never also a plate-gap or sweet-day note.
    expect(keysOf({ hour: 8, mealsToday: 0 })).not.toContain('denge-eksik')
  })

  it('names a run in progress when the table is still empty', () => {
    expect(keysOf({ hour: 15, mealsToday: 0, streak: 2 })).toContain('sofra-bekliyor')
    expect(keysOf({ hour: 15, mealsToday: 0, streak: 3 })).toContain('sofra-bekliyor-ritim')
    expect(lineOf('sofra-bekliyor-ritim', { hour: 15, mealsToday: 0, streak: 6 })).toContain(
      '6 gündür',
    )
    // The streak is claimed once, not by two notes in the same list.
    expect(keysOf({ hour: 15, mealsToday: 0, streak: 6 })).not.toContain('ritim')
  })

  it('tells the water by how far along it is, not by whether it is done', () => {
    // The same sentence at three glasses and at thirteen is what made the note
    // feel generic; every step of the way now has its own line.
    const water = (waterGlasses: number, waterTarget = 15) =>
      momentsOf({ waterGlasses, waterTarget }).find((m) => m.key.startsWith('su-'))

    expect(water(0)?.key).toBe('su-yok')
    expect(water(3)?.key).toBe('su-basi')
    expect(water(3)?.line).toContain('3 bardak')
    expect(water(8)?.key).toBe('su-yari')
    expect(water(8)?.line).toContain('yarıyı geçtin')
    // The reported case: 13 of 15 used to read the same as 3 of 15.
    expect(water(13)?.key).toBe('su-az-kaldi')
    expect(water(13)?.line).toContain('13/15')
    expect(water(14)?.key).toBe('su-son-bardak')
    expect(water(15)?.key).toBe('su-tamam')
    expect(water(20)?.key).toBe('su-tamam')
  })

  it('says the done thing out loud instead of going quiet', () => {
    // Water finished while the plate is still open: silence read as indifference.
    const done = momentsOf({ waterGlasses: 8, waterTarget: 8 })
    expect(done.map((m) => m.key)).toContain('su-tamam')
    expect(done.find((m) => m.key === 'su-tamam')?.line).toContain('tamam')

    // A complete day already says it in one breath; do not say it twice.
    const perfect = momentsOf({ missingGroups: [], waterGlasses: 8, waterTarget: 8 })
    expect(perfect.map((m) => m.key)).toEqual(['denge-ve-su'])
  })

  it('tells the plate at the resolution the day deserves', () => {
    const plate = (missingGroups: string[]) =>
      momentsOf({ missingGroups }).find((m) => m.key.startsWith('denge-eksik'))

    expect(plate(['sut'])?.key).toBe('denge-eksik-tek')
    expect(plate(['sut'])?.line).toContain('Tek süt ürünü kaldı')
    expect(plate(['sebze', 'meyve'])?.key).toBe('denge-eksik-ikili')
    expect(plate(['sebze', 'meyve'])?.line).toContain('sebze ve meyve')
    // Beyond two, one invitation beats reciting a list.
    expect(plate(['sebze', 'meyve', 'protein'])?.key).toBe('denge-eksik')
    expect(plate(['sebze', 'meyve', 'protein'])?.line).toContain('sebzeye')
  })

  it('invites the first measurement, then asks again once a week', () => {
    // Never measured: the targets cannot be about this body until it happens.
    const first = momentsOf({ daysSinceMeasurement: null })
    expect(first.map((m) => m.key)).toContain('olcum-yok')
    expect(first.find((m) => m.key === 'olcum-yok')?.action).toBe('body')

    // Fresh enough, and the day before it is due: nothing is said.
    expect(keysOf({ daysSinceMeasurement: 3 })).not.toContain('olcum-tazele')
    expect(keysOf({ daysSinceMeasurement: 6 })).not.toContain('olcum-tazele')

    const due = momentsOf({ daysSinceMeasurement: 9 })
    expect(due.map((m) => m.key)).toContain('olcum-tazele')
    expect(due.find((m) => m.key === 'olcum-tazele')?.line).toContain('9 gün')

    // Weekly, not nightly.
    expect(keysOf({ daysSinceMeasurement: null, hour: 23 })).not.toContain('olcum-yok')
  })

  it('shows every open thing in reading order, not just the first one', () => {
    const keys = keysOf({
      hour: 14,
      mealsToday: 2,
      missingGroups: ['sebze', 'meyve'],
      waterGlasses: 2,
      sweetCount: 2,
      streak: 4,
    })

    expect(keys).toEqual(['denge-eksik-ikili', 'su-basi', 'tatli-gunu', 'ritim'])
  })

  it('never rotates through more than four notes', () => {
    // Everything open at once; reading order decides what survives.
    const keys = keysOf({
      hour: 14,
      mealsToday: 2,
      missingGroups: ['sebze', 'meyve'],
      waterGlasses: 2,
      sweetCount: 3,
      streak: 5,
      daysSinceMeasurement: null,
    })

    expect(keys.length).toBeLessThanOrEqual(4)
    expect(keys).toEqual(['denge-eksik-ikili', 'su-basi', 'olcum-yok', 'tatli-gunu'])
  })

  it('invites each core group by name, with the suffix it actually takes', () => {
    const invite = (group: string) =>
      momentsOf({ missingGroups: [group, 'meyve', 'protein'] }).find(
        (m) => m.key === 'denge-eksik',
      )?.line ?? ''

    expect(invite('sebze')).toContain('sebzeye')
    expect(invite('meyve')).toContain('meyveye')
    expect(invite('protein')).toContain('proteine')
    expect(invite('tahil')).toContain('tahıla')
    expect(invite('sut')).toContain('süt ürününe')
  })

  it('still counts a group it cannot name, and asks in general terms', () => {
    // The catalogue can grow ahead of a shipped build.
    const line = lineOf('denge-eksik', { missingGroups: ['yosun'] })

    expect(line).not.toContain('undefined')
    expect(line).toContain('bir renk daha')
  })

  it('names a sweet day without passing sentence on it', () => {
    expect(keysOf({ sweetCount: 2 })).toContain('tatli-gunu')
    expect(keysOf({ sweetCount: 1, fastfoodCount: 1 })).toContain('tatli-gunu')
    expect(keysOf({ sweetCount: 1 })).not.toContain('tatli-gunu')
  })

  it('celebrates a rhythm only once the table has something on it', () => {
    expect(keysOf({ streak: 4 })).toContain('ritim')
    expect(keysOf({ streak: 2 })).not.toContain('ritim')
    // Still true at night, where it is a celebration rather than a request.
    expect(keysOf({ hour: 23, streak: 4 })).toEqual(['gece-dolu', 'ritim'])
  })
})

describe('Afi on Today: edge cases', () => {
  it('says nothing about water until a target has arrived', () => {
    for (const waterTarget of [0, Number.NaN, -4, Number.POSITIVE_INFINITY]) {
      const moments = momentsOf({ waterTarget, waterGlasses: 0 })
      // No target, no water line at all: not even the done one.
      expect(moments.map((m) => m.key)).toEqual(['denge-eksik-tek'])
      expect(moments[0]?.line).not.toMatch(/NaN|Infinity/)
    }
  })

  it('survives counts that arrive negative, fractional or not a number', () => {
    const moments = momentsOf({
      hour: Number.NaN,
      mealsToday: Number.NaN,
      waterGlasses: -3,
      streak: Number.NaN,
      sweetCount: Number.NaN,
      fastfoodCount: -1,
    })

    // NaN meals reads as an empty table at the default midday hour.
    expect(moments.map((m) => m.key)).toContain('sofra-bekliyor')
    for (const moment of moments) {
      expect(moment.line, moment.key).not.toMatch(/NaN|Infinity|undefined/)
    }
    expect(lineOf('su-basi', { waterGlasses: 5.7, waterTarget: 15 })).toContain('5 bardak')
  })

  it('clamps an hour that falls outside the clock', () => {
    expect(keysOf({ hour: -6, mealsToday: 0 })).toEqual(['gece-sessiz'])
    expect(keysOf({ hour: 99, mealsToday: 0 })).toEqual(['gece-sessiz'])
  })

  it('treats more water than the target as done, not as overflow', () => {
    expect(keysOf({ waterGlasses: 20, missingGroups: [] })).toEqual(['denge-ve-su'])
    expect(keysOf({ waterGlasses: 20 })).toContain('su-tamam')
  })

  it('handles a plate missing every group', () => {
    const moments = momentsOf({
      missingGroups: ['sebze', 'meyve', 'protein', 'tahil', 'sut'],
      waterGlasses: 8,
    })
    // The plate is wide open and the water is done: both get said.
    expect(moments.map((m) => m.key)).toEqual(['denge-eksik', 'su-tamam'])
    expect(moments[0]?.action).toBe('meal')
  })
})

/* A grid over every input the screen can hand in, so the invariants are checked
   on the whole space rather than on the handful of cases written by hand. */
const GRID: AfiMomentInput[] = []
for (const hour of [0, 4, 5, 8, 11, 12, 15, 21, 22, 23]) {
  for (const mealsToday of [0, 1, 3]) {
    for (const missing of [
      [],
      ['sebze'],
      ['sebze', 'meyve'],
      ['sebze', 'meyve', 'protein', 'tahil', 'sut'],
    ]) {
      for (const waterGlasses of [0, 2, 4, 6, 7, 8]) {
        for (const streak of [0, 3]) {
          for (const sweetCount of [0, 2]) {
            for (const daysSinceMeasurement of [0, 9, null]) {
              GRID.push(
                day({
                  hour,
                  mealsToday,
                  missingGroups: missing,
                  waterGlasses,
                  streak,
                  sweetCount,
                  daysSinceMeasurement,
                }),
              )
            }
          }
        }
      }
    }
  }
}

describe('Afi on Today: invariants across every state', () => {
  it('always has something to say once there is a record', () => {
    for (const input of GRID) {
      expect(collectAfiMoments(input).length, JSON.stringify(input)).toBeGreaterThan(0)
    }
  })

  it('never repeats a moment or contradicts itself in one list', () => {
    for (const input of GRID) {
      const keys = collectAfiMoments(input).map((moment) => moment.key)

      expect(new Set(keys).size, JSON.stringify(input)).toBe(keys.length)
      // A complete plate and an open plate cannot both be true.
      const plateOpen = keys.some((key) => key.startsWith('denge-eksik'))
      expect(
        plateOpen && (keys.includes('denge-tamam') || keys.includes('denge-ve-su')),
        JSON.stringify(input),
      ).toBe(false)
      // Only one water line, and only one plate line, per list.
      expect(keys.filter((key) => key.startsWith('su-')).length, JSON.stringify(input))
        .toBeLessThanOrEqual(1)
      expect(keys.filter((key) => key.startsWith('denge-eksik')).length, JSON.stringify(input))
        .toBeLessThanOrEqual(1)
      // Neither can an empty table and anything that assumes a started one.
      const emptyTable = keys.includes('sofra-bekliyor') || keys.includes('gunaydin')
      expect(emptyTable && keys.includes('ritim'), JSON.stringify(input)).toBe(false)
      // Night asks for nothing.
      const night = keys.includes('gece-dolu') || keys.includes('gece-sessiz')
      if (night) {
        expect(keys.some((key) => key.startsWith('denge-eksik')), JSON.stringify(input)).toBe(false)
        expect(keys.some((key) => key.startsWith('su-')), JSON.stringify(input)).toBe(false)
      }
    }
  })

  it('stays short enough to read through', () => {
    for (const input of GRID) {
      expect(collectAfiMoments(input).length, JSON.stringify(input)).toBeLessThanOrEqual(4)
    }
  })

  it('never counts calories, scolds, or dramatises a gap', () => {
    // BRAND.md voice table plus the gamification invariant against loss drama.
    const banned =
      /kalori|limit|aştın|başaramadın|kaybe|geride kaldın|yetersiz|hata yaptın|kullanıcı|maalesef/i
    const seen = new Set<string>()

    for (const input of GRID) {
      for (const moment of collectAfiMoments(input)) {
        seen.add(moment.key)
        expect(moment.line, moment.key).not.toMatch(banned)
        // Warm, not clipped: every line is a sentence.
        expect(moment.line, moment.key).toMatch(/[.!?🌱🌿🌟🌙💧🍲🎉]$/u)
        expect(['meal', 'body', null], moment.key).toContain(moment.action)
      }
    }

    // The grid reaches every state the module defines.
    expect(seen).toEqual(
      new Set([
        'denge-ve-su',
        'denge-tamam',
        'gece-dolu',
        'gece-sessiz',
        'gunaydin',
        'sofra-bekliyor',
        'sofra-bekliyor-ritim',
        'tatli-gunu',
        'su-yok',
        'su-basi',
        'su-yari',
        'su-az-kaldi',
        'su-son-bardak',
        'su-tamam',
        'denge-eksik',
        'denge-eksik-tek',
        'denge-eksik-ikili',
        'olcum-yok',
        'olcum-tazele',
        'ritim',
      ]),
    )
  })

  it('only uses mascot poses that exist', () => {
    const poses = new Set([
      'temel',
      'selam',
      'kutlama',
      'merak',
      'uyku',
      'aile',
      'su',
      'kasik',
      'oops',
      'mini',
    ])
    for (const input of GRID) {
      for (const moment of collectAfiMoments(input)) {
        expect(poses, moment.key).toContain(moment.pose)
      }
    }
  })
})

describe('Afi on Today: wiring', () => {
  it('feeds the note from the day summary and hides it during the guide', async () => {
    const source = await readFile(homeUrl, 'utf8')

    expect(source).toContain('collectAfiMoments')
    expect(source).toContain('summary && !guideState.active')
    expect(source).toContain('missingGroups: summary.nutrition.balance.missing')
    expect(source).toContain('waterTarget: summary.water.target')
    expect(source).toContain('onAddMeal={() => setAdding(true)}')
  })

  it('sits under the nutrition hero, not above it', async () => {
    const source = await readFile(homeUrl, 'utf8')
    const hero = source.indexOf('<NutritionCard')
    const note = source.indexOf('<AfiTodayNote')
    const header = source.indexOf('<TodayHeader')

    expect(hero).toBeGreaterThan(-1)
    expect(note).toBeGreaterThan(hero)
    expect(note).toBeGreaterThan(header)
  })

  it('cycles through the moments and replays the entrance on each one', async () => {
    const source = await readFile(noteUrl, 'utf8')

    expect(source).toContain('setInterval')
    expect(source).toContain('(current + 1) % total')
    expect(source).toContain('key={moment.key}')
    expect(source).toContain('entering={FadeInDown')
    // Decorative motion has to defer to the system setting.
    expect(source).toContain('reduceMotion(ReduceMotion.System)')
    /* A single moment must not spin a timer, and neither must a screen the
       person has walked away from: this tab stays mounted behind the others. */
    expect(source).toContain('if (total < 2 || !rotating) return')
    expect(source).toContain('useMotionActive()')
    // The reset is adjusted during render, not through a cascading effect.
    expect(source).toContain('if (signature !== rotatingFor)')
    expect(source).not.toMatch(/useEffect\(\(\) => \{\s*setIndex\(0\)/)
  })

  it('answers by changing pose, without rebuilding the mascot', async () => {
    const source = await readFile(noteUrl, 'utf8')
    const mascot = source.indexOf('<AfiPose')
    const keyed = source.indexOf('key={moment.key}')

    /* The key is what remounts a subtree, and a remounted mascot means four
       native SVG layers and five animation loops thrown away and rebuilt every
       five seconds, forever. It belongs on the line that changes, below the
       mascot, never on a wrapper holding it. */
    expect(mascot).toBeGreaterThan(-1)
    expect(keyed).toBeGreaterThan(mascot)
    /* One shell for both cases too: swapping Pressable for View would remount
       the mascot every time the rotation reached a moment that only reads. */
    expect(source).not.toContain('if (!invites) {')
  })

  it('keeps the mascot decorative and the line readable to a screen reader', async () => {
    const source = await readFile(noteUrl, 'utf8')

    expect(source).toContain('accessibilityLabel={invites ? `${line} ${label}.` : line}')
    // A shell that does not invite must not be announced as a button.
    expect(source).toContain("accessibilityRole={invites ? 'button' : undefined}")
    /* The invitation names what it opens: the plate, the measurement or the
       goal direction. Assert the mapping rather than the mere presence of the
       words, so a label cannot drift onto the wrong action. Whitespace is
       normalized because the chain is prettier-wrapped. */
    const flat = source.replace(/\s+/g, ' ')
    expect(flat).toContain("moment.action === 'body' ? 'Ölçüm ekle'")
    expect(flat).toContain("moment.action === 'goal' ? 'Yönümü seç'")
    expect(flat).toContain(": 'Besin ekle'")
    /* Every action the union allows must reach a handler; a moment that
       invites with no destination is a button that does nothing. */
    expect(flat).toContain("moment.action === 'body' ? onOpenBody")
    expect(flat).toContain("moment.action === 'goal' ? onOpenGoals")
    // The mascot itself carries no label; the line already says it.
    expect(source).not.toMatch(/<AfiPose[^>]*accessibilityLabel/s)
  })
})
