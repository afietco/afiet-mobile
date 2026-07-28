import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/**
 * The two pieces of the dissolved Hedeflerim screen that landed on Vücudum:
 * the acquaintance meter and "Sayılarla".
 *
 * The screens cannot be rendered here (vitest runs in node and react-native
 * does not load), so what is guarded is what is visible in the source and easy
 * to undo by accident: the promises of docs/hedeflerim.md sections 2, 6 and 12,
 * and the wiring rules that keep the two hosts of the goal engine from drifting.
 *
 * The layout the product owner asked for on 27 Jul 2026 is guarded too: the
 * meter opens the page, and the direction and the numbers stand side by side as
 * two cards. Ordering is asserted by source position, which is coarse but is
 * the only handle a source-level test has on a layout.
 */

const SCREEN = 'app/(tabs)/vucudum.tsx'
const METER = 'features/goals/AcquaintanceMeter.tsx'
const NUMBERS = 'features/goals/NumbersCard.tsx'
const PANEL = 'features/body/NumbersPanel.tsx'

function read(path: string): Promise<string> {
  return readFile(new URL(`../../apps/mobile/src/${path}`, import.meta.url), 'utf8')
}

/**
 * Comments explain the rules; they are not subject to them. A docblock is free
 * to say the word "kcal" while the screen it describes must never print one.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

describe('Vücudum goal layer wiring', () => {
  it('no longer routes to the Hedeflerim screen, which is gone', async () => {
    const screen = await read(SCREEN)
    // The prose may still name the screen it inherited these sections from; a
    // link to it would 404.
    expect(screen).not.toMatch(/['"]\/hedeflerim/)
    expect(screen).not.toContain('Hedeflerim ekranını aç')
  })

  it('hosts the meter, the direction card and the numbers card', async () => {
    const screen = await read(SCREEN)
    expect(screen).toContain('<AcquaintanceMeter')
    expect(screen).toContain('<DirectionRow')
    expect(screen).toContain('<NumbersCard')
  })

  it('reads the engine through the shared hook, exactly once', async () => {
    const screen = await read(SCREEN)
    expect(screen).not.toContain('calculateGoals')
    expect(screen.match(/useGoals\(/g)).toHaveLength(1)
  })

  it('opens the page with the meter, above the measurements', async () => {
    const screen = await read(SCREEN)
    const gate = screen.indexOf('{hasAttrs ? (')
    const meter = screen.indexOf('<AcquaintanceMeter')
    const measurementBranch = screen.indexOf('!latest ? (')
    expect(gate).toBeGreaterThan(-1)
    expect(measurementBranch).toBeGreaterThan(-1)
    // The meter is the first thing under the header, and the branch that needs
    // a weigh-in comes after it.
    expect(meter).toBeGreaterThan(gate)
    expect(meter).toBeLessThan(measurementBranch)
  })

  it('shows the meter before the first weigh-in, gated only on the profile basics', async () => {
    const screen = await read(SCREEN)
    const gate = screen.indexOf('{hasAttrs ? (')
    const meter = screen.indexOf('<AcquaintanceMeter')
    // Nothing between the gate and the meter may ask for a measurement: the
    // meter exists to invite the data that is missing, and "İlk kilo ölçünü
    // ekle" is exactly the invitation someone in that state needs.
    expect(screen.slice(gate, meter)).not.toMatch(/latest|measurements/)
  })

  it('keeps every invitation wired to the sheets this screen already owns', async () => {
    const screen = await read(SCREEN)
    expect(screen).toContain('onInvite={acceptInvite}')
    const handler = screen.slice(
      screen.indexOf('const acceptInvite'),
      screen.indexOf('const autoOpened'),
    )
    expect(handler).toContain('setSetupOpen(true)')
    expect(handler).toContain('setMeasureOpen(true)')
    // The logging invitation is the one door that is not on this screen.
    expect(handler).toContain("router.push('/beslenme')")
  })

  it('stands the direction and the numbers side by side, as two cards', async () => {
    const screen = await read(SCREEN)
    const pair = screen.indexOf('flex-row items-stretch gap-3')
    const direction = screen.indexOf('<DirectionRow')
    const numbers = screen.indexOf('<NumbersCard')
    expect(pair).toBeGreaterThan(-1)
    // Both cards live inside that one row, and each takes half of it.
    expect(direction).toBeGreaterThan(pair)
    expect(numbers).toBeGreaterThan(pair)
    expect(screen.slice(pair, numbers)).toContain('className="flex-1"')
    expect(screen).toContain('<NumbersCard className="flex-1" />')

    /* The pair sits directly above the measurement buttons, not at the foot of
       the page: both cards are about the body, and this is where the eye
       already is when someone opens Vücudum to act on it. */
    const measureButton = screen.indexOf('Ölçüm Ekle', pair)
    expect(measureButton).toBeGreaterThan(pair)
    expect(screen.indexOf('Bilgilerini düzenle')).toBe(-1)
  })

  it('keeps grams and kcal off the page itself', async () => {
    const screen = await read(SCREEN)
    // Section 12: the numbers are never the language of this screen. They are
    // one tap away, behind the card, and nowhere on the page.
    expect(withoutComments(screen)).not.toMatch(/kcal|gram/i)
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
    // Curiosity would be a lie once there is nothing left to learn, so the
    // figure settles into the warmth the closing line already speaks in.
    expect(source).toContain("complete ? 'sicaklik' : 'merak'")
  })
})

describe('Vücudum numbers card', () => {
  it('is a door rather than a panel, so the numbers open where there is room', async () => {
    const source = await read(NUMBERS)
    // Half a screen cannot hold three macro boxes, a BMI bar and a trend chart,
    // so the card opens the route that already renders them full screen.
    expect(source).toContain("router.push('/veri')")
    expect(source).not.toContain('NumbersPanel')
    expect(source).not.toContain('useState')
  })

  it('carries no figure on its face, so nobody is handed a number they did not ask for', async () => {
    const source = withoutComments(await read(NUMBERS))
    expect(source).not.toMatch(/kcal|Intl\.NumberFormat|formatRange|goals\./)
  })

  it('shows the numbers even when no direction has been chosen', async () => {
    // The engine reports an unchosen direction but no longer mutes anything:
    // the silent `duzen` default is a truthful balanced answer, and withholding
    // the figures left the numbers reading as broken for anyone who skipped the
    // question. Neither surface may reintroduce the gate.
    for (const path of [NUMBERS, PANEL]) {
      const source = await read(path)
      expect(source, path).not.toContain('directionUnchosen')
      expect(source, path).not.toContain('numericTargetsMuted')
    }
  })

  it('keeps the engine target with the rest of the numbers', async () => {
    const source = await read(PANEL)
    // Section 2: grams and kcal stay visible, one tap away, never on the page.
    expect(source).toContain('Günün enerjisi ve makroların')
    expect(source).toContain('goals?.target && goals.macros')
    // Section 9: when the engine withholds a target the card is absent, not
    // softened into a smaller figure.
    expect(source).toContain('<GoalTargetCard')
  })

  it('never renders a target weight or an implied duration', async () => {
    for (const path of [SCREEN, METER, NUMBERS, PANEL]) {
      const source = await read(path)
      expect(source, path).not.toContain('targetWeightRange')
      expect(source, path).not.toContain('impliedWeeklyChangeKg')
      expect(source, path).not.toContain('weeklyChangeCapKg')
    }
  })
})
