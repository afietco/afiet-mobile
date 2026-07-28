import { readdir, readFile } from 'node:fs/promises'
import { GOAL_DIRECTIONS } from '@afiet/core'
import { describe, expect, it } from 'vitest'

/**
 * Guards the goal direction question (docs/hedeflerim.md, sections 3, 7 and 12).
 *
 * The Hedeflerim screen was dissolved and the question became a sheet Afi asks.
 * It is now asked once during body setup, right after the activity level, so a
 * direction exists from day one; the sheet is the later-change path, reachable
 * from the standing row on Vücudum and from Today's one-time catch-up offer.
 * The component cannot be rendered here (vitest runs in node and react-native
 * does not load), but the promises it makes are all visible in the source and
 * all easy to undo by accident later.
 */

const SRC = new URL('../../apps/mobile/src/', import.meta.url)
const SHEET = 'features/goals/DirectionSheet.tsx'
const SETUP = 'features/body/BodySetupSheet.tsx'
const HOME = 'app/(tabs)/index.tsx'

function read(path: string): Promise<string> {
  return readFile(new URL(path, SRC), 'utf8')
}

describe('goal direction sentences', () => {
  it('offers the five sentences in order, without weight language', () => {
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
    const source = await read(SHEET)
    expect(source).toContain('GOAL_DIRECTIONS.map')
    expect(source).toContain('{option.label}')
    // The acknowledgement names the chosen direction; it asks the engine too.
    expect(source).toContain('goalDirectionMeta(')
    expect(source).not.toMatch(/hissetmek istiyorum/)
  })
})

describe('goal direction effect date', () => {
  /**
   * Section 7 is real and may not be hidden: a choice lands on the coming
   * Monday, never today. It is also not the point of the screen, and it used to
   * be shouted (a tinted banner above the answers, then a whole confirmation
   * beat after them). One quiet sentence, built from the date the rules
   * actually return, in one place.
   */
  it('says which Monday the choice starts on, once, from the real date', async () => {
    const source = await read(SHEET)
    expect(source).toContain('directionStartsOnNote')
    expect(source).toMatch(/formatLongTR\(startsOn\)/)
    expect(source).toMatch(/geçerli olur/)
  })

  it('keeps the week line the quietest thing on the sheet', async () => {
    const source = await read(SHEET)
    // The note reads at the smallest size in the faint colour, never on a slab
    // of its own, and never in the bold weights the question and answers use.
    expect(source).toMatch(/text-xs leading-4 text-faint[\s\S]*\{startsOnNote\}/)
    expect(source).not.toMatch(/bg-violet-50[^\n]*\n[^\n]*\{promise\}/)
  })

  it('says the same sentence wherever the question is asked', async () => {
    const [sheet, setup] = await Promise.all([read(SHEET), read(SETUP)])
    // One exported builder, so the two contexts cannot drift into two promises.
    expect(sheet).toContain('export function directionStartsOnNote')
    expect(setup).toContain("import { directionStartsOnNote } from '@/features/goals/DirectionSheet'")
    expect(setup).toContain('directionStartsOnNote(directionStartsOn)')
  })

  it('never claims a choice is in force today', async () => {
    for (const path of [SHEET, SETUP]) {
      const source = await read(path)
      expect(source, path).not.toMatch(/bugünden|hemen geçerli|şu andan itibaren/i)
    }
  })
})

describe('goal direction sheet shape', () => {
  it('commits on the tap instead of behind a confirm button', async () => {
    const source = await read(SHEET)
    expect(source).not.toMatch(/>\s*(Kaydet|Onayla|Devam)\s*</)
    // The tap stores the choice; the sheet then shows itself out on its own,
    // with no acknowledgement screen to sit through.
    expect(source).toContain('await choose(next)')
    expect(source).toContain('setCommitted(next)')
    expect(source).toContain('setTimeout(onClose, CLOSE_AFTER_CHOICE_MS)')
  })

  it('speaks the haptic language of the app', async () => {
    const source = await read(SHEET)
    expect(source).toContain('Haptics.selectionAsync()')
    expect(source).toContain('Haptics.NotificationFeedbackType.Success')
  })

  it('leaves the silent default unmarked, since nobody chose it', async () => {
    const source = await read(SHEET)
    expect(source).toContain('isDefault ? null : direction')
  })

  /**
   * The top of the sheet was being clipped. `ui/Sheet` caps a dynamically sized
   * sheet with a figure derived from the window, but inside a tab its container
   * is a tab bar shorter than that, so tall content resolves to a detent above
   * the container top and `overflow: hidden` ate the grab handle and the whole
   * title row. A ratio of the container cannot overshoot it.
   */
  it('pins its height instead of sizing to its content', async () => {
    const source = await read(SHEET)
    expect(source).toContain('heightRatio={SHEET_HEIGHT_RATIO}')
    expect(source).toMatch(/const SHEET_HEIGHT_RATIO = 0\.\d+/)
  })

  it('keeps Afi beside the question rather than stacked on the sheet title', async () => {
    const source = await read(SHEET)
    expect(source).toMatch(/flex-row items-center gap-3">\s*<AfiPose/)
    // The oversized stage light that sat under the title row is gone with it.
    expect(source).not.toContain('RadialGradient')
  })
})

describe('the goal direction as a setup step', () => {
  it('is asked immediately after the activity level', async () => {
    const source = await read(SETUP)
    expect(source).toContain('const DIRECTION_STEP = 4')
    // Step 3 is the activity level, so the direction is the very next question.
    expect(source).toMatch(/\{step === 3 \? \([\s\S]*ACTIVITY_LEVELS\.map/)
    expect(source).toMatch(/\{step === DIRECTION_STEP \? \([\s\S]*GOAL_DIRECTIONS\.map/)
    // And the sports questions moved down rather than being replaced.
    expect(source).toContain('const LAST_STEP = 6')
    expect(source).toContain('doesSport === false ? 6 : 7')
  })

  it('renders the engine sentences rather than a second copy of them', async () => {
    const source = await read(SETUP)
    expect(source).toContain('GOAL_DIRECTIONS.map')
    expect(source).toContain('{item.label}')
    expect(source).not.toMatch(/hissetmek istiyorum/)
  })

  it('commits on the tap, with no forward button to confirm it', async () => {
    const source = await read(SETUP)
    expect(source).toContain('void pickDirection(item.key)')
    expect(source).toContain('await chooseDirection(next)')
    expect(source).toMatch(/pickDirection[\s\S]*Haptics\.selectionAsync\(\)/)
    // The step moves on by itself, and the Devam button is not rendered on it.
    expect(source).toMatch(/setStep\(DIRECTION_STEP \+ 1\)/)
    expect(source).toContain('{step === DIRECTION_STEP ? null : (')
  })

  it('never marks the silent default as if it had been chosen', async () => {
    const source = await read(SETUP)
    expect(source).toContain('directionUnchosen ? null : activeDirection')
  })
})

describe("Afi's goal direction offer on Today", () => {
  /**
   * Setup asks the question now, so a new account arrives with a direction and
   * the offer never fires for them. It survives for the accounts that finished
   * setup before the step existed: they have no direction, were never asked,
   * and leaving them on a silent default forever is the dishonest option.
   */
  it('is a catch-up: only for someone who has none and was never asked', async () => {
    const source = await read(HOME)
    const flat = source.replace(/\s+/g, ' ')
    expect(flat).toContain('!goalDirectionTaught')
    expect(flat).toContain('goalDirectionUnchosen')
    // An unread log looks exactly like an unchosen one; the offer waits for it.
    expect(flat).toContain('loading: goalDirectionLoading')
    expect(flat).toContain('!goalDirectionLoading')
  })

  it('retires on the tap that takes it, not on the render that shows it', async () => {
    const source = await read(HOME)
    expect(source).toMatch(/onOpenGoals=\{\(\) => \{[\s\S]*markFtueSeen\('goalDirectionTaught'\)/)
  })
})

describe('goal direction forbidden values', () => {
  /**
   * Section 12: no target weight and no duration promise reaches any surface.
   * The sweep is over the whole goals feature and the tabs that host it rather
   * than a fixed list, so a component added tomorrow is covered on arrival.
   */
  it('never renders a target weight or an implied duration', async () => {
    const feature = (await readdir(new URL('features/goals/', SRC)))
      .filter((name) => name.endsWith('.tsx') || name.endsWith('.ts'))
      .map((name) => `features/goals/${name}`)
    const hosts = ['app/(tabs)/index.tsx', 'app/(tabs)/vucudum.tsx', 'app/(tabs)/beslenme.tsx']

    expect(feature).toContain(SHEET)
    for (const path of [...feature, ...hosts]) {
      const source = await read(path)
      expect(source, path).not.toContain('targetWeightRange')
      expect(source, path).not.toContain('impliedWeeklyChangeKg')
      expect(source, path).not.toContain('weeklyChangeCapKg')
    }
  })
})

describe('the dissolved Hedeflerim route', () => {
  it('is not referenced anywhere in the app', async () => {
    const files: string[] = []
    const walk = async (dir: URL, prefix: string) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const next = `${prefix}${entry.name}`
        if (entry.isDirectory()) await walk(new URL(`${entry.name}/`, dir), `${next}/`)
        else if (next.endsWith('.ts') || next.endsWith('.tsx')) files.push(next)
      }
    }
    await walk(SRC, '')

    for (const path of files) {
      const source = await read(path)
      expect(source, path).not.toContain("'/hedeflerim'")
      expect(source, path).not.toContain('"/hedeflerim"')
    }
  })
})
