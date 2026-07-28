import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/**
 * "Günün ölçüsü" on the Beslenme tab: the card the hand measures moved into.
 *
 * The screen cannot be rendered here (vitest runs in node and react-native does
 * not load), so what is guarded is what the source promises and what would be
 * easy to undo by accident: one engine behind both views, the record still
 * providing what was eaten, the hand measures as the default language, and no
 * calorie verdict beside them.
 */

const SRC = new URL('../../apps/mobile/src/', import.meta.url)

const SCREEN = 'app/(tabs)/beslenme.tsx'
const CARD = 'features/nutrition/DailyMeasureCard.tsx'
const NUMBERS = 'features/nutrition/MacroProgressCard.tsx'
const TOGGLE = 'features/nutrition/MeasureViewToggle.tsx'
const HANDS = 'features/goals/HandMeasures.tsx'
const ALL = [SCREEN, CARD, NUMBERS, TOGGLE, HANDS]

function read(path: string): Promise<string> {
  return readFile(new URL(path, SRC), 'utf8')
}

describe('measure view on Beslenme', () => {
  it('holds the slot the macro card used to', async () => {
    const source = await read(SCREEN)
    expect(source).toContain('<DailyMeasureCard summary={summary} />')
    // The grams body is reached through the card now, never mounted directly,
    // or the toggle would have nothing to switch.
    expect(source).not.toContain('<MacroProgressCard')
  })

  it('reads the shared hook rather than calling the engine again', async () => {
    const source = await read(CARD)
    expect(source).toContain("from '@/features/goals/useGoals'")
    expect(source).toContain('today: summary.date')
    /* Beslenme reads the measures, not the acquaintance facts, and asking for
       them would add a ['meals'] subscription that re-runs on every meal
       logged, on the screen where meals are logged. */
    expect(source).not.toContain('withFacts')
    // Vücudum reads the same hook; a second call site would drift the moment
    // either screen forgot an input.
    expect(source).not.toContain('calculateGoals')
  })

  it('takes both targets from the engine and never from the summary', async () => {
    for (const path of [CARD, NUMBERS]) {
      const source = await read(path)
      expect(source, path).not.toContain('summary.targets')
      expect(source, path).not.toContain('hasBodyData')
    }
  })

  it('still counts what was eaten from the record', async () => {
    const source = await read(NUMBERS)
    expect(source).toContain('const totals = summary.nutrition')
    expect(source).toContain('totals[m.key]')
    expect(source).toContain('totals.kcal')
  })

  it('never prints the calorie target beside what was eaten', async () => {
    const source = await read(NUMBERS)
    // The energy target only scales the bar. A number set against a total turns
    // a compass into a verdict (BRAND.md, voice).
    expect(source).toContain('targets?.energy.mid')
    expect(source).not.toContain('energy.text')
  })

  it('offers exactly two named views and remembers the choice', async () => {
    const source = await read(TOGGLE)
    expect(source).toContain('El ölçüsü')
    expect(source).toContain('Sayılarla')
    expect([...source.matchAll(/key: '(hand|numbers)'/g)]).toHaveLength(2)
    expect(source).toContain('accessibilityState={{ selected }}')

    const card = await read(CARD)
    expect(card).toContain('useMeasureView()')
    expect(card).toContain('<MeasureViewToggle value={view} onChange={setView} />')
  })

  it('swaps the body without rebuilding the card around it', async () => {
    const source = await read(CARD)
    const toggle = source.indexOf('<MeasureViewToggle')
    const keyedBody = source.indexOf('key={view}')
    expect(toggle).toBeGreaterThan(-1)
    expect(keyedBody).toBeGreaterThan(toggle)
    // The header and the toggle live outside the keyed body, so tapping the
    // pair does not remount the card.
    expect(source).not.toMatch(/<View key=\{view\} className="rounded-2xl/)
  })

  it('keeps the switch quick and yields to reduce motion', async () => {
    for (const path of ALL) {
      const source = await read(path)
      for (const match of source.matchAll(/entering=\{([^}]*)\}/g)) {
        expect(match[1], path).toContain('reduceMotion(ReduceMotion.System)')
        const duration = Number(match[1].match(/duration\((\d+)\)/)?.[1] ?? 0)
        expect(duration, path).toBeLessThanOrEqual(200)
      }
    }
  })

  it('explains a missing target instead of showing a borrowed one', async () => {
    const source = await read(CARD)
    for (const kind of ['minor', 'incomplete', 'unchosen', 'loading']) {
      expect(source, kind).toContain(`'${kind}'`)
    }
    // Every dead end offers a way on rather than a shrug.
    expect(source).toContain('Vücudum')
    expect(source).toContain('Tekrar dene')
  })

  it('speaks without scolding and promises no weight or date', async () => {
    for (const path of ALL) {
      const source = await read(path)
      expect(source, path).not.toContain('targetWeightRange')
      expect(source, path).not.toContain('impliedWeeklyChangeKg')
      expect(source, path).not.toContain('weeklyChangeCapKg')
      expect(source, path).not.toMatch(/hedef kilo|kaç kilo|haftada .* kilo/i)
      expect(source, path).not.toMatch(/aştın|limit|başaramadın|yetersiz/i)
    }
  })
})
