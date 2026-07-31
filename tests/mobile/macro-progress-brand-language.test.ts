import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/**
 * The macro card on Beslenme: how it speaks, and where its numbers come from.
 *
 * The screen cannot be rendered here (vitest runs in node and react-native does
 * not load), so what is guarded is what the source promises and what would be
 * easy to undo by accident. The shaping of the targets themselves is unit
 * tested in macro-targets.test.ts.
 */

const SRC = new URL('../../apps/mobile/src/', import.meta.url)

const SCREEN = 'app/(tabs)/beslenme.tsx'
const CARD = 'features/nutrition/MacroProgressCard.tsx'

function read(path: string): Promise<string> {
  return readFile(new URL(path, SRC), 'utf8')
}

describe('macro progress brand language', () => {
  it('presents energy as approximate information without a target ratio', async () => {
    const source = await read(CARD)

    expect(source).toContain('Enerji ve Makro Dengesi')
    expect(source).toContain('Yaklaşık {num0.format(Math.round(totals.kcal))} kcal')
    expect(source).not.toContain('{num0.format(Math.round(target))} kcal')
  })

  it('never prints the calorie target beside what was eaten', async () => {
    const source = await read(CARD)
    // The energy target only scales the bar. A number set against a total turns
    // a compass into a verdict (BRAND.md, voice).
    expect(source).toContain('targets?.energy.mid')
    expect(source).not.toContain('energy.text')
  })

  it('speaks without scolding and promises no weight or date', async () => {
    for (const path of [SCREEN, CARD]) {
      const source = await read(path)
      expect(source, path).not.toContain('targetWeightRange')
      expect(source, path).not.toContain('impliedWeeklyChangeKg')
      expect(source, path).not.toContain('weeklyChangeCapKg')
      expect(source, path).not.toMatch(/hedef kilo|kaç kilo|haftada .* kilo/i)
      expect(source, path).not.toMatch(/aştın|limit|başaramadın|yetersiz/i)
    }
  })

  it('prints the target it has instead of announcing that one is coming', async () => {
    const source = await read(CARD)
    /* The card used to read "Referans hazırlanıyor" wherever a number belonged,
       for everyone who had not chosen a direction. The engine answers for
       anyone it can compute for, so the placeholder has no state left to
       occupy: what is missing on the rare day is the scale, and the eaten
       amount still prints on its own. */
    expect(source).not.toMatch(/hazırlanıyor/i)
    expect(source).not.toMatch(/yönünü seç/i)
  })

  it('explains a withheld target instead of showing a borrowed one', async () => {
    const source = await read(CARD)
    // The two honest silences the engine still keeps, plus the hook's own.
    for (const kind of ['minor', 'incomplete', 'loading']) {
      expect(source, kind).toContain(`'${kind}'`)
    }
    // A direction was never a reason to withhold a number, and is not one here.
    expect(source).not.toContain('unchosen')
    // Every dead end offers a way on rather than a shrug.
    expect(source).toContain('Vücudum')
    expect(source).toContain('Tekrar dene')
  })
})

describe('macro card targets come from the goal engine', () => {
  it('holds the slot on Beslenme', async () => {
    const source = await read(SCREEN)
    /* The card now also reads the day's log: it swipes between the totals,
       the meals behind them and the foods behind those. */
    expect(source).toContain('<MacroProgressCard summary={summary} entries={entries} />')
  })

  it('reads the shared hook rather than calling the engine again', async () => {
    const source = await read(CARD)
    expect(source).toContain("from '@/features/goals/useGoals'")
    expect(source).toContain('today: summary.date')
    /* Beslenme reads the targets, not the acquaintance facts, and asking for
       them would add a ['meals'] subscription that re-runs on every meal
       logged, on the screen where meals are logged. */
    expect(source).not.toContain('withFacts')
    // Vücudum reads the same hook; a second call site would drift the moment
    // either screen forgot an input.
    expect(source).not.toContain('calculateGoals')
  })

  it('takes the target from the engine and never from the summary', async () => {
    const source = await read(CARD)
    expect(source).not.toContain('summary.targets')
    expect(source).not.toContain('hasBodyData')
  })

  it('still counts what was eaten from the record', async () => {
    const source = await read(CARD)
    expect(source).toContain('const totals = summary.nutrition')
    expect(source).toContain('totals[m.key]')
    expect(source).toContain('totals.kcal')
  })
})
