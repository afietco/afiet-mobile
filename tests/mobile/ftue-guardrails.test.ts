import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  CHAPTER_KEYS,
  chapterDoors,
  EMPTY_RECORD,
} from '../../apps/mobile/src/features/ftue/chapters'

const read = (relative: string) =>
  readFile(new URL(`../../apps/mobile/src/${relative}`, import.meta.url), 'utf8')

/**
 * The guided tour this system replaces trapped people, and every trap it had
 * was a shape rather than a typo. These are here so none of the shapes can
 * come back, whatever the chapters end up saying.
 *
 *   - A tour that ran for two days after the account was made and then went
 *     quiet forever, leaving flags nothing could ever clear.
 *   - A persisted flag that disabled navigation.
 *   - A step that covered the screen with nothing on it to tap.
 *   - A live query that stayed mounted for the rest of the account's life to
 *     serve two days of introduction.
 */

describe('FTUE guardrails', () => {
  it('has no window anywhere: nothing expires, nothing is missed', async () => {
    const chapters = await read('features/ftue/chapters.ts')

    /* Readiness is derived from what the person has done, and the only clock
       the queue is allowed to read is the day and hour it is handed. A wall
       clock inside these rules is how "come back on Friday" became "you can
       never see this again". */
    expect(chapters).not.toContain('Date.now')
    expect(chapters).not.toContain('_WINDOW')
  })

  it('never lets a door be shut for good by a chapter nobody took up', () => {
    // Waving a chapter away costs at most a day of waiting, never the feature.
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 1 })).board).toBe(false)
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 2 })).board).toBe(true)
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 7 })).trail).toBe(true)
  })

  it('leaves navigation alone, whatever the FTUE has recorded', async () => {
    const [layout, tabBar] = await Promise.all([
      read('app/(tabs)/_layout.tsx'),
      read('features/nav/LiquidTabBar.tsx'),
    ])

    for (const source of [layout, tabBar]) {
      expect(source).not.toContain('afiGuideStarted')
      expect(source).not.toContain('guideLocked')
      expect(source).not.toContain('useChapterFlow')
    }
    // The bar has no disabled state left to reach at all.
    expect(tabBar).not.toContain('disabled')
  })

  it('draws nothing at all until a step has found what it points at', async () => {
    const spotlight = await read('features/ftue/guided-spotlight.tsx')

    /* The guard, and the reason it can be this blunt: an unmeasured step is
       indistinguishable from an unmeasurable one, so neither gets to paint. */
    expect(spotlight).toContain('const stepIsBlind = targeted && !target')
    expect(spotlight).toContain('if (stepIsBlind) return null')
  })

  it('offers a way out of every chapter it draws', async () => {
    const [spotlight, views] = await Promise.all([
      read('features/ftue/guided-spotlight.tsx'),
      read('features/ftue/chapter-views.tsx'),
    ])

    expect(spotlight).toContain('function DismissButton')
    // Both shapes a step can take carry it: the pointing bubble and the card.
    expect(spotlight).toContain('<DismissButton onDismiss={onDismiss} />')
    expect(spotlight).toContain('<DismissButton onDismiss={onDismiss} align="left" />')

    /* One per chapter this build draws, and no chapter may be drawn without
       one. The scenes hand it to both the backdrop and a named button; the
       spotlight and the inline cards carry their own. Nine chapters, so at
       least nine ways out. */
    const exits = views.match(/flow\.dismiss\(/g) ?? []
    expect(exits.length).toBeGreaterThanOrEqual(9)
  })

  it('never hides a hook behind a boolean', async () => {
    const flow = await read('features/ftue/useChapterFlow.ts')

    /* `useFtueSeen(a) || useFtueSeen(b)` stops calling the second one as soon
       as the first is true, so the hook count changes between renders and the
       screen dies inside React with an error that names neither the file nor
       the flag. Every flag gets its own line, and the booleans are combined
       afterwards. */
    expect(flow).not.toMatch(/useFtueSeen\([^)]*\)\s*(\|\||&&)/)
    expect(flow).not.toMatch(/(\|\||&&)\s*useFtueSeen\(/)
  })

  it('stops querying once the guide has nothing left to say', async () => {
    const flow = await read('features/ftue/useChapterFlow.ts')

    /* The reward chapter is the only one that needs the network, and an
       account that has finished the guide must not go on paying for it. */
    const settled = flow.indexOf('const settled =')
    const query = flow.indexOf('useLiveValue', settled)
    const gate = flow.indexOf('if (settled) return null', query)
    expect(settled).toBeGreaterThan(-1)
    expect(query).toBeGreaterThan(settled)
    expect(gate).toBeGreaterThan(query)
  })

  it('draws every chapter in the guide, including the ones not built yet', async () => {
    const guide = await read('features/ftue/sofra-setup.tsx')

    /* The table is laid whole from the first day. A guide that only lists what
       already works reads as a finished app with pieces missing, where one
       that names what is still coming reads as a table being set. */
    for (const key of CHAPTER_KEYS) {
      expect(guide, key).toContain(`'${key}'`)
    }
  })
})

function signals(overrides: { loggedDays: number }) {
  return {
    loggedDays: overrides.loggedDays,
    mealsToday: 1,
    claimableQuests: 0,
    hour: 20,
    today: '2026-08-15',
    hasBodyProfile: false,
    hasGroup: false,
    hasSofra: false,
    repeatedFoods: 0,
    unknownToday: false,
    chatVisited: false,
    awayDays: 0,
  }
}
