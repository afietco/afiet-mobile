import { readFile } from 'node:fs/promises'
import { GOAL_DIRECTIONS, GOAL_ESTIMATE_NOTE, HAND_TERMS } from '@afiet/core'
import { describe, expect, it } from 'vitest'

/**
 * Guards the promises the Hedeflerim screen makes (docs/hedeflerim.md).
 *
 * The screen itself cannot be rendered here: vitest runs in a node environment
 * and react-native does not load. What can be checked, and is worth checking,
 * are the constraints of section 12, which are all visible in the source and
 * all easy to undo by accident later.
 */

const SCREEN = 'app/hedeflerim.tsx'
const PICKER = 'features/goals/DirectionPicker.tsx'
const METER = 'features/goals/AcquaintanceMeter.tsx'
const HANDS = 'features/goals/HandMeasures.tsx'
const NUMBERS = 'features/goals/NumbersSection.tsx'
const ALL = [SCREEN, PICKER, METER, HANDS, NUMBERS]

function read(path: string): Promise<string> {
  return readFile(new URL(`../../apps/mobile/src/${path}`, import.meta.url), 'utf8')
}

describe('Hedeflerim direction picker', () => {
  it('offers the five direction sentences in order, without weight language', () => {
    expect(GOAL_DIRECTIONS.map((option) => option.key)).toEqual([
      'hafifle',
      'donusum',
      'koru',
      'guclen',
      'duzen',
    ])
    expect(GOAL_DIRECTIONS.map((option) => option.label)).toEqual([
      'Daha hafif hissetmek istiyorum',
      'Kilom değişmeden daha iyi hissetmek istiyorum',
      'Olduğum yerde iyiyim',
      'Daha güçlü hissetmek istiyorum',
      'Önce bir düzen kurayım',
    ])
  })

  it('renders those sentences rather than a second copy that could drift', async () => {
    const source = await read(PICKER)
    expect(source).toContain('GOAL_DIRECTIONS.map')
    expect(source).toContain('{option.label}')
    expect(source).not.toMatch(/hissetmek istiyorum/)
  })

  it('always says which Monday the choice starts on', async () => {
    const source = await read(PICKER)
    expect(source).toContain('startsOn')
    expect(source).toContain('pending.effectiveFrom')
    // Every branch of the note names a date and the word that dates it.
    expect(source.match(/geçerli|başlar/g)?.length).toBeGreaterThanOrEqual(3)
  })
})

describe('Hedeflerim acquaintance meter', () => {
  it('reaches 100 with the four items that exist in beta', async () => {
    const source = await read(METER)
    const weights = [...source.matchAll(/weight: (\d+)/g)].map((match) => Number(match[1]))
    expect(weights).toEqual([40, 20, 25, 15])
    expect(weights.reduce((total, weight) => total + weight, 0)).toBe(100)
  })

  it('does not list movement data, which no one could grant in beta', async () => {
    const source = await read(METER)
    const invitations = source.slice(source.indexOf('const STEPS'), source.indexOf('export interface'))
    expect(invitations).not.toMatch(/HealthKit|Health Connect|hareket verisi|sağlık verisi|izin/i)
  })

  it('speaks as an invitation, never as a score', async () => {
    const source = await read(METER)
    expect(source).not.toMatch(/eksik|tamamla|başaramadın|yetersiz/i)
  })
})

describe('Hedeflerim hand measures', () => {
  it('uses the blog vocabulary exactly', () => {
    expect(Object.values(HAND_TERMS)).toEqual(['avuç içi', 'yumruk', 'kapalı avuç', 'başparmak'])
  })

  it('prints the engine text and never builds a decimal of its own', async () => {
    const source = await read(HANDS)
    expect(source).toContain('{measure.text}')
    expect(source).not.toContain('toFixed')
    expect(source).not.toMatch(/çukur avuç/)
  })

  it('carries the honesty anchor as the engine words it', async () => {
    expect(GOAL_ESTIMATE_NOTE).toBe(
      'Bu ölçüler şimdilik tahmin. Kayıt biriktikçe sana göre düzelteceğim.',
    )
    const screen = await read(SCREEN)
    expect(screen).toContain('note={goals.confidenceNote}')
  })
})

describe('Hedeflerim numbers section', () => {
  it('starts collapsed so grams and kcal are never the first thing read', async () => {
    const source = await read(NUMBERS)
    expect(source).toContain('useState(false)')
  })

  it('stays quiet about the numeric target until a direction is chosen', async () => {
    const source = await read(NUMBERS)
    expect(source).toContain('goals.numericTargetsMuted')
  })
})

describe('Hedeflerim forbidden values', () => {
  it('never renders a target weight or an implied duration', async () => {
    for (const path of ALL) {
      const source = await read(path)
      expect(source).not.toContain('targetWeightRange')
      expect(source).not.toContain('impliedWeeklyChangeKg')
      expect(source).not.toContain('weeklyChangeCapKg')
    }
  })
})
