import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * One rule, checked over the whole app: nothing a person needs may make itself
 * visible with an entering animation.
 *
 * An entering animation owns the first frame of the view it wraps. Reanimated
 * commits the hidden values at mount (FadeInDown starts at opacity 0 and
 * translateY 25) and only hands them back when the animation actually runs. A
 * run that never happens leaves the subtree mounted, laid out and hit-testable,
 * but invisible: content nobody can read, buttons nobody can find.
 *
 * This app has hit that four times. The tab scenes lost their cross-fade for it
 * (8058090, "mounted at zero opacity"), the acquaintance setup opened blank in
 * 0.8.2, the add-food sheet opened with nothing under its title (a42ece6), and
 * on 0.9.0 a device reported the Grubum tab as a header with an empty page
 * under it: the empty state, holding the only "Grup kur" and "Grup ara" in the
 * app, was inside one of these wrappers. Each round the fix was the same, and
 * each round the rule lived only where it had just been broken.
 *
 * So it lives here now, as an allowlist. Adding `entering=` to a file outside
 * the list fails this test, and the way to pass is to answer the question in
 * the failure message rather than to extend the list by reflex.
 */

const MOBILE_SRC = fileURLToPath(new URL('../../apps/mobile/src', import.meta.url))

/**
 * Files allowed to animate something in.
 *
 * The bar is not "this animation is nice", it is "if this animation never runs,
 * the person loses nothing they need". Every entry here animates a detail
 * inside a parent that is already on screen by itself, and none of them holds
 * the only way out of anything.
 */
const ALLOWED = new Map<string, string>([
  [
    'features/home/AfiTodayNote.tsx',
    "Afi's line inside a card that renders without it; the note keyed on the moment is the only animated part.",
  ],
  [
    'features/nutrition/AfiNutritionNote.tsx',
    'Same shape as AfiTodayNote: a line inside an already visible card.',
  ],
  [
    'features/goals/AcquaintanceMeter.tsx',
    'The step line under a progress bar that draws on its own.',
  ],
  [
    'features/changelog/WhatsNewSheet.tsx',
    'Release-note rows inside a sheet that has its own header and close button.',
  ],
])

async function tsxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const found = await Promise.all(
    entries.map(async (entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return tsxFiles(full)
      return entry.name.endsWith('.tsx') ? [full] : []
    }),
  )
  return found.flat()
}

describe('entering animations', () => {
  it('never hold content or an exit behind themselves', async () => {
    const files = await tsxFiles(MOBILE_SRC)
    const users = (
      await Promise.all(
        files.map(async (file) => {
          const source = await readFile(file, 'utf8')
          return /entering=/.test(source) ? path.relative(MOBILE_SRC, file) : null
        }),
      )
    ).filter((file): file is string => file !== null)

    const unlisted = users.filter((file) => !ALLOWED.has(file)).sort()

    expect(
      unlisted,
      unlisted.length === 0
        ? ''
        : `These files animate something in:\n  ${unlisted.join('\n  ')}\n\n` +
            'If that animation never runs, is anything the person needs still ' +
            'reachable? If not, use a plain View. If it genuinely is, add the ' +
            'file to ALLOWED with the reason.',
    ).toEqual([])
  })

  it('keeps the group tab reachable without one', async () => {
    const [tab, home] = await Promise.all([
      readFile(new URL('../../apps/mobile/src/app/(tabs)/grubum.tsx', import.meta.url), 'utf8'),
      readFile(
        new URL('../../apps/mobile/src/features/groups/GroupHome.tsx', import.meta.url),
        'utf8',
      ),
    ])

    // The only door to creating or joining a group is the tab's empty state.
    expect(tab).toContain('Grup kur')
    expect(tab).toContain('Grup ara')
    expect(tab).not.toMatch(/entering=/)
    expect(home).not.toMatch(/entering=/)
  })

  it('keeps the first-log celebration reachable without one', async () => {
    const [scene, celebration] = await Promise.all([
      readFile(new URL('../../apps/mobile/src/ui/maskot/AfiScene.tsx', import.meta.url), 'utf8'),
      readFile(
        new URL('../../apps/mobile/src/features/ftue/FirstLogCelebration.tsx', import.meta.url),
        'utf8',
      ),
    ])

    /* The scene is drawn at full opacity from its first frame, so an
       animation that never runs cannot leave an invisible wall in front of
       somebody who has just logged their first meal. Both ways out are
       explicit: the labelled button and the backdrop. */
    expect(celebration).toContain('actionLabel=')
    expect(celebration).toContain('onClose={onClose}')
    expect(scene).not.toMatch(/entering=/)
  })
})
