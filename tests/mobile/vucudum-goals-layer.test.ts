import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/**
 * The two pieces of the dissolved Hedeflerim screen that landed on Vücudum:
 * the acquaintance meter and the "Sayılarla" section.
 *
 * The screens cannot be rendered here (vitest runs in node and react-native
 * does not load), so what is guarded is what is visible in the source and easy
 * to undo by accident: the promises of docs/hedeflerim.md sections 2, 6 and 12,
 * and the wiring rules that keep the two hosts of the goal engine from drifting.
 */

const SCREEN = 'app/(tabs)/vucudum.tsx'
const METER = 'features/goals/AcquaintanceMeter.tsx'
const NUMBERS = 'features/goals/NumbersSection.tsx'

function read(path: string): Promise<string> {
  return readFile(new URL(`../../apps/mobile/src/${path}`, import.meta.url), 'utf8')
}

describe('Vücudum goal layer wiring', () => {
  it('no longer routes to the Hedeflerim screen, which is gone', async () => {
    const screen = await read(SCREEN)
    // The prose may still name the screen it inherited these sections from; a
    // link to it would 404.
    expect(screen).not.toMatch(/['"]\/hedeflerim/)
    expect(screen).not.toContain('Hedeflerim ekranını aç')
  })

  it('hosts both the meter and the collapsed numbers section', async () => {
    const screen = await read(SCREEN)
    expect(screen).toContain('<AcquaintanceMeter')
    expect(screen).toContain('<NumbersSection')
  })

  it('reads the engine through the shared hook, exactly once', async () => {
    const screen = await read(SCREEN)
    expect(screen).not.toContain('calculateGoals')
    expect(screen.match(/useGoals\(/g)).toHaveLength(1)
  })

  it('shows the meter before the first weigh-in, gated only on the profile basics', async () => {
    const screen = await read(SCREEN)
    const measurementBranch = screen.indexOf('!latest ? (')
    const gate = screen.indexOf('{hasAttrs ? (')
    const meter = screen.indexOf('<AcquaintanceMeter')
    expect(measurementBranch).toBeGreaterThan(-1)
    // The meter sits after the branch that requires a measurement, under a gate
    // that asks only for the profile attributes.
    expect(gate).toBeGreaterThan(measurementBranch)
    expect(meter).toBeGreaterThan(gate)
  })
})

describe('Vücudum acquaintance meter', () => {
  it('reaches 100 with the four items that exist in beta', async () => {
    const source = await read(METER)
    const weights = [...source.matchAll(/weight: (\d+)/g)].map((match) => Number(match[1]))
    expect(weights).toEqual([40, 20, 25, 15])
    expect(weights.reduce((total, weight) => total + weight, 0)).toBe(100)
  })

  it('does not list movement data, which no one could grant in beta', async () => {
    const source = await read(METER)
    const steps = source.slice(source.indexOf('const STEPS'), source.indexOf('export interface'))
    expect(steps).not.toMatch(/HealthKit|Health Connect|hareket verisi|sağlık verisi|izin/i)
  })

  it('speaks as an invitation, never as a score', async () => {
    const source = await read(METER)
    expect(source).not.toMatch(/eksik|tamamla|başaramadın|yetersiz/i)
  })

  it('brings Afi once, in a pose that gets to know rather than inspects', async () => {
    const source = await read(METER)
    expect(source.match(/<AfiPose/g)).toHaveLength(1)
    // `arama` is the magnifier pose: a mascot examining the person is the one
    // reading this meter must never have.
    expect(source).not.toMatch(/'arama'|"arama"/)
  })
})

describe('Vücudum numbers section', () => {
  it('starts collapsed so grams and kcal are never the first thing read', async () => {
    const source = await read(NUMBERS)
    expect(source).toContain('useState(false)')
  })

  it('stays quiet about the numeric target until a direction is chosen', async () => {
    const source = await read(NUMBERS)
    expect(source).toContain('goals.numericTargetsMuted')
  })

  it('never renders a target weight or an implied duration', async () => {
    for (const path of [SCREEN, METER, NUMBERS]) {
      const source = await read(path)
      expect(source).not.toContain('targetWeightRange')
      expect(source).not.toContain('impliedWeeklyChangeKg')
      expect(source).not.toContain('weeklyChangeCapKg')
    }
  })
})
