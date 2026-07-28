import { readdir, readFile } from 'node:fs/promises'
import { GOAL_DIRECTIONS } from '@afiet/core'
import { describe, expect, it } from 'vitest'

/**
 * Guards the goal direction question (docs/hedeflerim.md, sections 3, 7 and 12).
 *
 * The Hedeflerim screen was dissolved and the question became a sheet Afi asks,
 * reachable from Today's one-time offer and from the standing row on Vücudum.
 * The component cannot be rendered here (vitest runs in node and react-native
 * does not load), but the promises it makes are all visible in the source and
 * all easy to undo by accident later.
 */

const SRC = new URL('../../apps/mobile/src/', import.meta.url)
const SHEET = 'features/goals/DirectionSheet.tsx'

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
  it('always says which Monday the choice starts on', async () => {
    const source = await read(SHEET)
    expect(source).toContain('startsOn')
    expect(source).toContain('pending.effectiveFrom')
    // Every branch of the promise names a date and the word that dates it.
    expect(source.match(/geçerli|başlar|başlıyorum/g)?.length).toBeGreaterThanOrEqual(4)
  })

  it('never claims a choice is in force today', async () => {
    const source = await read(SHEET)
    expect(source).not.toMatch(/bugünden|hemen geçerli|şu andan itibaren/i)
  })
})

describe('goal direction sheet shape', () => {
  it('commits on the tap instead of behind a confirm button', async () => {
    const source = await read(SHEET)
    expect(source).not.toMatch(/>\s*(Kaydet|Onayla|Devam)\s*</)
    // The tap stores the choice and the sheet then shows itself out on its own.
    expect(source).toContain('await choose(next)')
    expect(source).toContain('setAcknowledged(')
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
