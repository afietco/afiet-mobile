import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  buildNutritionMoments,
  type AfiNutritionEntry,
  type AfiNutritionMomentInput,
} from '@/features/nutrition/afiNutritionMoment'

const noteUrl = new URL('../../apps/mobile/src/features/nutrition/AfiNutritionNote.tsx', import.meta.url)
const maskotUrl = new URL('../../apps/mobile/src/ui/maskot/index.tsx', import.meta.url)
const motionUrl = new URL('../../apps/mobile/src/ui/maskot/motion.ts', import.meta.url)

const food = (meal: string, ...groups: string[]): AfiNutritionEntry => ({ meal, groups })

/** Mid-afternoon, breakfast and lunch in, one core group still open. */
const day = (over: Partial<AfiNutritionMomentInput> = {}): AfiNutritionMomentInput => ({
  hour: 13,
  entries: [
    food('kahvalti', 'tahil', 'sut'),
    food('ogle', 'protein', 'meyve'),
  ],
  missingGroups: ['sebze'],
  ...over,
})

const momentsOf = (over: Partial<AfiNutritionMomentInput> = {}) => buildNutritionMoments(day(over))
const keysOf = (over: Partial<AfiNutritionMomentInput> = {}) => momentsOf(over).map((m) => m.key)
const lineOf = (key: string, over: Partial<AfiNutritionMomentInput> = {}) =>
  momentsOf(over).find((m) => m.key === key)?.line ?? ''

describe('Afi on Beslenme: what the plate says right now', () => {
  it('invites once and says nothing else when nothing is logged yet', () => {
    const moments = momentsOf({ entries: [], missingGroups: ['sebze', 'meyve', 'protein'] })

    expect(moments.map((m) => m.key)).toEqual(['sofra-bos'])
    expect(moments[0]?.action).toBe('food')
    expect(moments[0]?.pose).toBe('kasik')
    // Even late in the day the empty plate is the only thing worth saying.
    expect(keysOf({ entries: [], hour: 22 })).toEqual(['sofra-bos'])
  })

  it('leads with a full spread and stops asking for groups', () => {
    const keys = keysOf({ missingGroups: [] })

    expect(keys[0]).toBe('denge-guzel')
    expect(keys).not.toContain('eksik-grup')
    expect(keys).not.toContain('tek-grup')
    // A finished plate asks for nothing.
    expect(momentsOf({ missingGroups: [] })[0]?.action).toBeNull()
  })

  it('notices a meal slot that stayed empty well past its hour', () => {
    const onlyLunch = [food('ogle', 'protein')]

    expect(keysOf({ entries: onlyLunch, hour: 10 })).not.toContain('ogun-bosluk')
    expect(keysOf({ entries: onlyLunch, hour: 11 })).toContain('ogun-bosluk')
    expect(lineOf('ogun-bosluk', { entries: onlyLunch, hour: 11 })).toContain('Kahvaltı')
  })

  it('names the most recent empty slot, not the oldest one', () => {
    const onlySnack = [food('ara', 'kuruyemis')]

    expect(lineOf('ogun-bosluk', { entries: onlySnack, hour: 12 })).toContain('Kahvaltı')
    expect(lineOf('ogun-bosluk', { entries: onlySnack, hour: 16 })).toContain('Öğle yemeği')
    expect(lineOf('ogun-bosluk', { entries: onlySnack, hour: 23 })).toContain('Akşam yemeği')
  })

  it('never misses a snack, because a snack has no hour of its own', () => {
    const allThree = [food('kahvalti', 'tahil'), food('ogle', 'protein'), food('aksam', 'sebze')]

    expect(keysOf({ entries: allThree, hour: 23 })).not.toContain('ogun-bosluk')
  })

  it('stays quiet about meal slots in the small hours', () => {
    // The date has already rolled over, so nothing is overdue yet.
    for (const hour of [0, 3, 6]) {
      expect(keysOf({ entries: [food('ara', 'meyve')], hour })).not.toContain('ogun-bosluk')
    }
  })

  it('names what the plate leans on next to what is still open', () => {
    const leaning = [
      food('kahvalti', 'tahil'),
      food('ogle', 'tahil'),
      food('aksam', 'tahil'),
      food('ara', 'meyve'),
    ]
    const line = lineOf('tek-grup', { entries: leaning, hour: 22, missingGroups: ['sebze'] })

    expect(line).toContain('en çok tahıl var')
    expect(line).toContain('sebzeye')
    expect(keysOf({ entries: leaning, hour: 22, missingGroups: ['sebze'] })).not.toContain(
      'eksik-grup',
    )
  })

  it('only calls it a lean when one group holds more than half the plate', () => {
    const even = [food('kahvalti', 'tahil'), food('ogle', 'protein'), food('aksam', 'sut')]
    const majority = [food('kahvalti', 'tahil'), food('ogle', 'tahil'), food('aksam', 'sut')]

    expect(keysOf({ entries: even, hour: 22 })).toContain('eksik-grup')
    expect(keysOf({ entries: majority, hour: 22 })).toContain('tek-grup')
  })

  it('needs more than a bite before the plate can have a shape', () => {
    // Two group tags is not yet a plate to read a lean from.
    expect(keysOf({ entries: [food('kahvalti', 'tahil', 'tahil')], hour: 10 })).toContain(
      'eksik-grup',
    )
    expect(keysOf({ entries: [food('kahvalti', 'tahil')], hour: 10 })).not.toContain('tek-grup')
  })

  it('counts a food once per group, however many times it is listed', () => {
    // One simit tagged twice must not outweigh two other foods.
    const entries = [
      food('kahvalti', 'tahil', 'tahil', 'tahil'),
      food('ogle', 'protein'),
      food('aksam', 'sebze'),
    ]

    expect(keysOf({ entries, hour: 22, missingGroups: ['sut'] })).not.toContain('tek-grup')
  })

  it('invites each core group by name, with the suffix it actually takes', () => {
    const invite = (group: string) => lineOf('eksik-grup', { missingGroups: [group] })

    expect(invite('sebze')).toContain('sebzeye')
    expect(invite('meyve')).toContain('meyveye')
    expect(invite('protein')).toContain('proteine')
    expect(invite('tahil')).toContain('tahıla')
    expect(invite('sut')).toContain('süt ürününe')
  })

  it('still counts a group it cannot name, and asks in general terms', () => {
    // The catalogue can grow ahead of a shipped build.
    const line = lineOf('eksik-grup', { missingGroups: ['yosun'] })

    expect(line).not.toContain('undefined')
    expect(line).toContain('bir renk daha')
  })

  it('names a group it can only half read', () => {
    // Unknown key first: the invitation falls through to the one it knows.
    expect(lineOf('eksik-grup', { missingGroups: ['yosun', 'sebze'] })).toContain('sebzeye')
  })

  it('shows every open thing in reading order, not just the first one', () => {
    const leaning = [
      food('kahvalti', 'tahil'),
      food('kahvalti', 'tahil'),
      food('ogle', 'protein'),
    ]

    expect(keysOf({ entries: leaning, hour: 21, missingGroups: ['sebze'] })).toEqual([
      'ogun-bosluk',
      'tek-grup',
    ])
  })
})

describe('Afi on Beslenme: edge cases', () => {
  it('clamps an hour that falls outside the clock', () => {
    const onlySnack = [food('ara', 'meyve')]

    expect(keysOf({ entries: onlySnack, hour: -6 })).not.toContain('ogun-bosluk')
    expect(lineOf('ogun-bosluk', { entries: onlySnack, hour: 99 })).toContain('Akşam yemeği')
  })

  it('reads an hour that is not a number as midday', () => {
    const onlySnack = [food('ara', 'meyve')]

    expect(lineOf('ogun-bosluk', { entries: onlySnack, hour: Number.NaN })).toContain('Kahvaltı')
    expect(lineOf('ogun-bosluk', { entries: onlySnack, hour: 13.7 })).toContain('Kahvaltı')
  })

  it('ignores foods that carry no group at all', () => {
    // An unknown food still fills a meal slot, it just cannot shape the plate.
    const entries = [food('kahvalti'), food('ogle'), food('aksam')]
    const keys = keysOf({ entries, hour: 22, missingGroups: ['sebze'] })

    expect(keys).toEqual(['eksik-grup'])
    expect(keys).not.toContain('tek-grup')
  })

  it('survives empty strings arriving in either list', () => {
    const moments = momentsOf({
      entries: [food('', ''), food('ogle', 'protein')],
      missingGroups: ['', 'sebze'],
    })

    for (const moment of moments) {
      expect(moment.line, moment.key).not.toMatch(/undefined|NaN/)
    }
    expect(moments.map((m) => m.key)).toContain('eksik-grup')
  })
})

/* A grid over every shape the screen can hand in, so the invariants are checked
   on the whole space rather than on the handful of cases written by hand. */
const PLATES: AfiNutritionEntry[][] = [
  [],
  [food('kahvalti', 'tahil')],
  [food('ara', 'tatli')],
  [food('kahvalti', 'tahil'), food('ogle', 'protein')],
  [food('kahvalti', 'tahil'), food('ogle', 'tahil'), food('aksam', 'tahil')],
  [food('kahvalti', 'tahil', 'sut'), food('ogle', 'protein', 'sebze'), food('aksam', 'meyve')],
  [food('kahvalti'), food('ogle'), food('aksam'), food('ara')],
]

const GRID: AfiNutritionMomentInput[] = []
for (const hour of [0, 8, 11, 13, 15, 20, 21, 23]) {
  for (const entries of PLATES) {
    for (const missingGroups of [
      [],
      ['sebze'],
      ['sebze', 'meyve'],
      ['sebze', 'meyve', 'protein', 'tahil', 'sut'],
      ['yosun'],
    ]) {
      GRID.push({ hour, entries, missingGroups })
    }
  }
}

describe('Afi on Beslenme: invariants across every state', () => {
  it('always has something to say', () => {
    for (const input of GRID) {
      expect(buildNutritionMoments(input).length, JSON.stringify(input)).toBeGreaterThan(0)
    }
  })

  it('never repeats a moment or contradicts itself in one list', () => {
    for (const input of GRID) {
      const keys = buildNutritionMoments(input).map((moment) => moment.key)
      const where = JSON.stringify(input)

      expect(new Set(keys).size, where).toBe(keys.length)
      // A full spread and an open group cannot both be true.
      expect(keys.includes('denge-guzel') && keys.includes('eksik-grup'), where).toBe(false)
      expect(keys.includes('denge-guzel') && keys.includes('tek-grup'), where).toBe(false)
      // Neither can a leaning plate and a plate with no shape.
      expect(keys.includes('tek-grup') && keys.includes('eksik-grup'), where).toBe(false)
      // An empty plate is the whole note, never one voice among several.
      expect(keys.includes('sofra-bos') && keys.length > 1, where).toBe(false)
    }
  })

  it('stays short enough to read through', () => {
    for (const input of GRID) {
      expect(buildNutritionMoments(input).length, JSON.stringify(input)).toBeLessThanOrEqual(2)
    }
  })

  it('never counts calories, scolds, or dramatises a gap', () => {
    // BRAND.md voice table plus the gamification invariant against loss drama.
    const banned =
      /kalori|limit|aştın|başaramadın|kaybe|geride kaldın|yetersiz|unuttun|hata yaptın|kullanıcı|maalesef/i
    const seen = new Set<string>()

    for (const input of GRID) {
      for (const moment of buildNutritionMoments(input)) {
        seen.add(moment.key)
        expect(moment.line, moment.key).not.toMatch(banned)
        // Warm, not clipped: every line is a sentence.
        expect(moment.line, moment.key).toMatch(/[.!?🌿🌟🍲]$/u)
        // Em dashes are banned in product copy (BRAND.md, ui-copy-punctuation).
        expect(moment.line, moment.key).not.toContain('—')
        expect(['food', null], moment.key).toContain(moment.action)
      }
    }

    // The grid reaches every state the module defines.
    expect(seen).toEqual(
      new Set([
        'sofra-bos',
        'denge-guzel',
        'ogun-bosluk',
        'tek-grup',
        'eksik-grup',
        // Only surfaces on a plate that is asking for nothing.
        'diyetisyen-yakinda',
      ]),
    )
  })

  it('only uses mascot poses and motions that exist', async () => {
    const [maskot, motion] = await Promise.all([
      readFile(maskotUrl, 'utf8'),
      readFile(motionUrl, 'utf8'),
    ])

    for (const input of GRID) {
      for (const moment of buildNutritionMoments(input)) {
        expect(maskot, moment.key).toMatch(new RegExp(`\\|\\s*'${moment.pose}'`))
        expect(motion, moment.key).toMatch(new RegExp(`\\|\\s*'${moment.motion}'`))
      }
    }
  })
})

describe('Afi on Beslenme: the note itself', () => {
  it('cycles through the moments and replays the entrance on each one', async () => {
    const source = await readFile(noteUrl, 'utf8')

    expect(source).toContain('setInterval')
    expect(source).toContain('(current + 1) % total')
    expect(source).toContain('key={moment.key}')
    expect(source).toContain('entering={FadeInDown')
    // Decorative motion has to defer to the system setting.
    expect(source).toContain('reduceMotion(ReduceMotion.System)')
    // A single moment must not spin a timer.
    expect(source).toContain('if (total < 2) return')
    // The reset is adjusted during render, not through a cascading effect.
    expect(source).toContain('if (signature !== rotatingFor)')
    expect(source).not.toMatch(/useEffect\(\(\) => \{\s*setIndex\(0\)/)
  })

  it('does not repaint the mascot when only the screen around it re-rendered', async () => {
    const source = await readFile(noteUrl, 'utf8')

    expect(source).toContain('}, sameCard)')
    expect(source).toContain('prev.moment.line === next.moment.line')
    // The screen's fresh closure must not be what breaks the memo.
    expect(source).toContain('addFoodRef.current')
  })

  it('keeps the mascot decorative and the line readable to a screen reader', async () => {
    const source = await readFile(noteUrl, 'utf8')

    expect(source).toContain('accessibilityLabel={line}')
    expect(source).toContain('accessibilityLabel={`${line} Besin ekle.`}')
    // The mascot itself carries no label; the line already says it.
    expect(source).not.toMatch(/<AfiPose[^>]*accessibilityLabel/s)
  })
})

describe('the dietitian teaser', () => {
  it('waits for a plate that is asking for nothing', () => {
    /* A gap on the plate has something real to say. A teaser must never push
       that down the rotation, or make the rotation longer than it needs to be. */
    const asking = buildNutritionMoments({
      hour: 13,
      entries: [{ meal: 'kahvalti', groups: ['tahil'] }],
      missingGroups: ['sebze', 'protein'],
    })
    expect(asking.some((moment) => moment.action === 'food')).toBe(true)
    expect(asking.map((moment) => moment.key)).not.toContain('diyetisyen-yakinda')
  })

  it('promises nothing it cannot open', () => {
    const quiet = buildNutritionMoments({
      hour: 13,
      entries: [
        { meal: 'kahvalti', groups: ['tahil', 'protein'] },
        { meal: 'ogle', groups: ['sebze', 'meyve', 'sut'] },
      ],
      missingGroups: [],
    })
    const teaser = quiet.find((moment) => moment.key === 'diyetisyen-yakinda')
    expect(teaser).toBeDefined()
    // Nothing to tap: the feature does not exist yet.
    expect(teaser?.action).toBeNull()
  })
})
