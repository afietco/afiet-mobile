import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { shouldStartAfiGuide } from '../../apps/mobile/src/features/ftue/afi-guide-state'

const read = (relative: string) =>
  readFile(new URL(`../../apps/mobile/src/${relative}`, import.meta.url), 'utf8')

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The guided tour trapped people, twice over, and both traps were permanent.
 *
 * The tour writes `afiGuideStarted` on the account the moment it begins, and
 * the tab bar used to read that flag directly to decide whether to disable
 * itself. But the tour will only run for two days after the account is made.
 * On day three it stopped rendering while the flag stayed, so the tabs went
 * dead with nothing on screen to explain it and no action left that could
 * clear the flag: the only writer of the completion marker was the tour's own
 * last step, which by then could never be shown.
 *
 * Separately, a step whose highlight could not be measured drew its dimming
 * layer with no bubble on it, because the fallback card was reserved for steps
 * that never had a target in the first place. That is a black screen that eats
 * every touch.
 *
 * These are here so neither shape can come back: no persisted flag may disable
 * navigation, and no step may cover the screen without something to tap.
 */
describe('guided tour lockout', () => {
  it('leaves navigation alone, whatever the tour flags say', async () => {
    const [layout, tabBar] = await Promise.all([
      read('app/(tabs)/_layout.tsx'),
      read('features/nav/LiquidTabBar.tsx'),
    ])

    for (const source of [layout, tabBar]) {
      expect(source).not.toContain('afiGuideStarted')
      expect(source).not.toContain('guideLocked')
    }
    // The bar has no disabled state left to reach at all.
    expect(tabBar).not.toContain('disabled')
  })

  it('does not bounce the body tab away while the tour is unfinished', async () => {
    const body = await read('app/(tabs)/vucudum.tsx')
    // A redirect driven by the same flag pinned people to one tab.
    expect(body).not.toContain('guideLocked')
    expect(body).not.toContain("router.replace('/')")
  })

  it('draws nothing at all until a step has found what it points at', async () => {
    const spotlight = await read('features/ftue/guided-spotlight.tsx')

    /* The guard, and the reason it can be this blunt: an unmeasured step is
       indistinguishable from an unmeasurable one, so neither gets to paint. */
    expect(spotlight).toContain('const stepIsBlind = targeted && !target')
    expect(spotlight).toContain('if (stepIsBlind) return null')
  })

  it('offers a way out of every step it does draw', async () => {
    const [spotlight, guide] = await Promise.all([
      read('features/ftue/guided-spotlight.tsx'),
      read('features/ftue/today-afi-guide.tsx'),
    ])

    expect(spotlight).toContain('function DismissButton')
    // Both shapes a step can take carry it: the pointing bubble and the card.
    expect(spotlight).toContain('<DismissButton onDismiss={onDismiss} />')
    expect(spotlight).toContain('<DismissButton onDismiss={onDismiss} align="left" />')

    /* The bubble passes touches through so the highlight underneath stays
       tappable. `none` would do that by swallowing this button along with
       everything else; `box-none` lets the one child that wants a touch have
       it. */
    const bubble = spotlight.slice(spotlight.indexOf('function GuideBubble'))
    expect(bubble).toContain('pointerEvents="box-none"')
    expect(bubble).not.toContain('pointerEvents="none"')

    /* Every step that can strand someone hands it down: the opening card and
       the three pointing steps. The closing card is the exception, because its
       own button already ends the tour. */
    const dismissals = guide.match(/onDismiss=\{skip\}/g) ?? []
    expect(dismissals.length).toBeGreaterThanOrEqual(2)
  })

  it('ends itself once it can no longer run', async () => {
    const guide = await read('features/ftue/today-afi-guide.tsx')

    /* Both markers, always together. `useAfiGuideCompleted` requires the pair,
       so writing one of them is the same as writing neither. */
    expect(guide).toContain("markFtueSeen('afiGuideDone')\n      markFtueSeen('starterDone')")
    expect(guide).toContain("if (started) finishGuide('expired')")
  })

  it('confirms the window that used to strand an unfinished tour', () => {
    const created = '2026-07-01T10:00:00Z'
    const args = { profileCreatedAt: created, legacyGuideShown: false, legacyGuideDone: false }

    expect(shouldStartAfiGuide({ ...args, nowMs: Date.parse(created) + DAY_MS })).toBe(true)
    // Past here the tour can never show another step, so it must not be the
    // thing anything else is waiting on.
    expect(shouldStartAfiGuide({ ...args, nowMs: Date.parse(created) + 3 * DAY_MS })).toBe(false)
  })
})
