import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { chooseAfiMoment, type AfiMoment, type AfiMomentInput } from '@/features/home/afiMoment'

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
  neverLogged: false,
  ...over,
})

const keyOf = (over: Partial<AfiMomentInput> = {}) => chooseAfiMoment(day(over))?.key ?? null
const momentOf = (over: Partial<AfiMomentInput> = {}) =>
  chooseAfiMoment(day(over)) as AfiMoment

describe('Afi on Today: which moment', () => {
  it('stands down before the first ever record, where the hero card already has Afi', () => {
    expect(chooseAfiMoment(day({ neverLogged: true }))).toBeNull()
    // Even in a state that would otherwise celebrate.
    expect(chooseAfiMoment(day({ neverLogged: true, missingGroups: [] }))).toBeNull()
  })

  it('celebrates a complete plate above everything else about today', () => {
    expect(keyOf({ missingGroups: [], waterGlasses: 3 })).toBe('denge-tamam')
    expect(keyOf({ missingGroups: [] })).toBe('denge-ve-su')
    // A complete day still wins at midnight.
    expect(keyOf({ missingGroups: [], hour: 23 })).toBe('denge-ve-su')
  })

  it('keeps company at night instead of asking for anything', () => {
    expect(keyOf({ hour: 23 })).toBe('gece-dolu')
    expect(keyOf({ hour: 2 })).toBe('gece-dolu')
    expect(keyOf({ hour: 23, mealsToday: 0 })).toBe('gece-sessiz')
    expect(momentOf({ hour: 23 }).action).toBeNull()
    expect(momentOf({ hour: 23, mealsToday: 0 }).action).toBeNull()
  })

  it('puts the night boundary at 22:00 and 05:00', () => {
    expect(keyOf({ hour: 21, mealsToday: 0 })).toBe('sofra-bekliyor')
    expect(keyOf({ hour: 22, mealsToday: 0 })).toBe('gece-sessiz')
    expect(keyOf({ hour: 4, mealsToday: 0 })).toBe('gece-sessiz')
    expect(keyOf({ hour: 5, mealsToday: 0 })).toBe('gunaydin')
  })

  it('greets the morning and invites the rest of the day', () => {
    expect(keyOf({ hour: 8, mealsToday: 0 })).toBe('gunaydin')
    expect(keyOf({ hour: 11, mealsToday: 0 })).toBe('gunaydin')
    expect(keyOf({ hour: 12, mealsToday: 0 })).toBe('sofra-bekliyor')
    expect(momentOf({ hour: 8, mealsToday: 0 }).action).toBe('meal')
  })

  it('names a run in progress when the table is still empty', () => {
    expect(keyOf({ hour: 15, mealsToday: 0, streak: 2 })).toBe('sofra-bekliyor')
    expect(keyOf({ hour: 15, mealsToday: 0, streak: 3 })).toBe('sofra-bekliyor-ritim')
    expect(momentOf({ hour: 15, mealsToday: 0, streak: 6 }).line).toContain('6 gündür')
  })

  it('nudges whichever of water and balance is further from done', () => {
    // Water untouched, one group missing: water is the bigger gap.
    expect(keyOf({ waterGlasses: 0 })).toBe('su-yok')
    // Water almost done, four groups missing: the plate is the bigger gap.
    expect(keyOf({ waterGlasses: 7, missingGroups: ['sebze', 'meyve', 'protein', 'tahil'] })).toBe(
      'denge-eksik',
    )
    expect(momentOf({ waterGlasses: 5 }).key).toBe('su-devam')
    expect(momentOf({ waterGlasses: 5 }).line).toContain('5 bardak')
  })

  it('invites each core group by name, with the suffix it actually takes', () => {
    const invite = (group: string) => momentOf({ missingGroups: [group] }).line

    expect(invite('sebze')).toContain('sebzeye')
    expect(invite('meyve')).toContain('meyveye')
    expect(invite('protein')).toContain('proteine')
    expect(invite('tahil')).toContain('tahıla')
    expect(invite('sut')).toContain('süt ürününe')
  })

  it('still counts a group it cannot name, and asks in general terms', () => {
    // The catalogue can grow ahead of a shipped build.
    const moment = momentOf({ missingGroups: ['yosun'] })

    expect(moment.key).toBe('denge-eksik')
    expect(moment.line).not.toContain('undefined')
    expect(moment.line).toContain('bir renk daha')
  })

  it('names a sweet day without passing sentence on it', () => {
    expect(keyOf({ sweetCount: 2 })).toBe('tatli-gunu')
    expect(keyOf({ sweetCount: 1, fastfoodCount: 1 })).toBe('tatli-gunu')
    expect(keyOf({ sweetCount: 1 })).toBe('denge-eksik')
    // A complete plate is still a complete plate.
    expect(keyOf({ sweetCount: 3, missingGroups: [] })).toBe('denge-ve-su')
  })
})

describe('Afi on Today: edge cases', () => {
  it('says nothing about water until a target has arrived', () => {
    for (const waterTarget of [0, Number.NaN, -4, Number.POSITIVE_INFINITY]) {
      const moment = momentOf({ waterTarget, waterGlasses: 0 })
      expect(moment.key).toBe('denge-eksik')
      expect(moment.line).not.toMatch(/NaN|Infinity/)
    }
  })

  it('survives counts that arrive negative, fractional or not a number', () => {
    const moment = momentOf({
      hour: Number.NaN,
      mealsToday: Number.NaN,
      waterGlasses: -3,
      streak: Number.NaN,
      sweetCount: Number.NaN,
      fastfoodCount: -1,
    })

    // NaN meals reads as an empty table at the default midday hour.
    expect(moment.key).toBe('sofra-bekliyor')
    expect(moment.line).not.toMatch(/NaN|Infinity|undefined/)
    expect(momentOf({ waterGlasses: 5.7 }).line).toContain('5 bardak')
  })

  it('clamps an hour that falls outside the clock', () => {
    expect(keyOf({ hour: -6, mealsToday: 0 })).toBe('gece-sessiz')
    expect(keyOf({ hour: 99, mealsToday: 0 })).toBe('gece-sessiz')
  })

  it('treats more water than the target as done, not as overflow', () => {
    expect(keyOf({ waterGlasses: 20, missingGroups: [] })).toBe('denge-ve-su')
    expect(keyOf({ waterGlasses: 20 })).toBe('denge-eksik')
  })

  it('handles a plate missing every group', () => {
    const moment = momentOf({
      missingGroups: ['sebze', 'meyve', 'protein', 'tahil', 'sut'],
      waterGlasses: 8,
    })
    expect(moment.key).toBe('denge-eksik')
    expect(moment.action).toBe('meal')
  })
})

describe('Afi on Today: voice', () => {
  /* Every state the ladder can reach, so the copy rules are checked on all of
     them rather than on the handful a single scenario happens to hit. */
  const everyMoment = (): AfiMoment[] => {
    const inputs: Partial<AfiMomentInput>[] = [
      { missingGroups: [] },
      { missingGroups: [], waterGlasses: 3 },
      { hour: 23 },
      { hour: 23, mealsToday: 0 },
      { hour: 8, mealsToday: 0 },
      { hour: 15, mealsToday: 0 },
      { hour: 15, mealsToday: 0, streak: 5 },
      { sweetCount: 2 },
      { waterGlasses: 0 },
      { waterGlasses: 5 },
      { missingGroups: ['sebze'] },
      { missingGroups: ['yosun'] },
    ]
    return inputs.map((over) => momentOf(over))
  }

  it('reaches every state it defines, each with its own key', () => {
    const keys = new Set(everyMoment().map((moment) => moment.key))

    expect(keys).toEqual(
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
        'su-devam',
        'denge-eksik',
      ]),
    )
  })

  it('never counts calories, scolds, or dramatises a gap', () => {
    // BRAND.md voice table plus the gamification invariant against loss drama.
    const banned =
      /kalori|limit|aştın|başaramadın|kaybe|geride kaldın|yetersiz|hata yaptın|kullanıcı|maalesef/i

    for (const moment of everyMoment()) {
      expect(moment.line, moment.key).not.toMatch(banned)
      expect(moment.line.trim().length, moment.key).toBeGreaterThan(0)
      // Warm, not clipped: every line is a sentence.
      expect(moment.line, moment.key).toMatch(/[.!?🌱🌿🌟🌙💧🍲🎉]$/u)
    }
  })

  it('asks for at most one thing, and only where something can be done', () => {
    for (const moment of everyMoment()) {
      expect(['meal', null], moment.key).toContain(moment.action)
    }
    // Celebrations and night notes never carry a call to action.
    for (const key of ['denge-ve-su', 'denge-tamam', 'gece-dolu', 'gece-sessiz']) {
      const moment = everyMoment().find((m) => m.key === key)
      expect(moment?.action, key).toBeNull()
    }
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
    for (const moment of everyMoment()) {
      expect(poses, moment.key).toContain(moment.pose)
    }
  })
})

describe('Afi on Today: wiring', () => {
  it('feeds the note from the day summary and hides it during the guide', async () => {
    const source = await readFile(homeUrl, 'utf8')

    expect(source).toContain('chooseAfiMoment')
    expect(source).toContain('summary && !guideState.active')
    expect(source).toContain('missingGroups: summary.nutrition.balance.missing')
    expect(source).toContain('waterTarget: summary.water.target')
    expect(source).toContain('onAddMeal={() => setAdding(true)}')
  })

  it('lets the note replay its entrance whenever the moment changes', async () => {
    const source = await readFile(noteUrl, 'utf8')

    expect(source).toContain('key={moment.key}')
    expect(source).toContain('entering={FadeInDown')
    // Decorative motion has to defer to the system setting.
    expect(source).toContain('reduceMotion(ReduceMotion.System)')
  })

  it('keeps the mascot decorative and the line readable to a screen reader', async () => {
    const source = await readFile(noteUrl, 'utf8')

    expect(source).toContain('accessibilityLabel={line}')
    expect(source).toContain('accessibilityLabel={`${line} Besin ekle.`}')
    // The mascot itself carries no label; the line already says it.
    expect(source).not.toMatch(/<AfiPose[^>]*accessibilityLabel/s)
  })
})
