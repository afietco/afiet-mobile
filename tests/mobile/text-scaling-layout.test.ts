import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Layouts have to survive the text size the person chose.
 *
 * On iOS that reaches 3.1x with the larger accessibility sizes on, and someone
 * who needs it has it on for every app they own. This has broken the same way
 * three times now (0.8.2 and 0.8.3 both shipped a fix for a Devam button that
 * had gone past the bottom edge), so the rules are pinned here rather than
 * remembered.
 *
 * Two rules, both about the same failure: a control that cannot be reached.
 *
 *  1. A flow that gates on a button puts its body in a scroll view and the
 *     button outside it. Pushing a button down with a `flex-1` spacer works
 *     only while the body is shorter than the screen.
 *  2. Nothing positions itself from a guess about its own height. Text size
 *     decides that, and the app does not decide text size.
 */

const read = (path: string) =>
  readFile(fileURLToPath(new URL(`../../apps/mobile/src/${path}`, import.meta.url)), 'utf8')

describe('flows keep their progression control reachable', () => {
  it('scrolls the onboarding question instead of pushing Devam off the edge', async () => {
    const source = await read('app/onboarding.tsx')

    expect(source).toContain('<ScrollView')
    expect(source).toContain('flexGrow: 1')
    /* The spacer is the bug: it collapses to nothing the moment the question
       is taller than the screen, and takes the button with it. */
    expect(source).not.toMatch(/<View className="flex-1" \/>/)
  })

  it('scrolls the first meal screen against its Kaydet button', async () => {
    const source = await read('app/first-meal.tsx')
    const scroll = source.indexOf('<ScrollView')
    const button = source.lastIndexOf('Kaydet')

    expect(scroll).toBeGreaterThan(-1)
    expect(button).toBeGreaterThan(scroll)
    // The button is a sibling of the scroll area, so it keeps its own height.
    expect(source).not.toContain('mt-auto')
  })

  it('centres the guide card by layout, never by half of an assumed height', async () => {
    const source = await read('features/ftue/guided-spotlight.tsx')

    /* This card covers the screen while the guide runs, so its own button is
       the only way out. Positioned by a constant, it went past the bottom.
       Matched as code, not as prose: the docblock still names the old value
       so the next reader knows what this is guarding against. */
    expect(source).not.toMatch(/transform: *\[\{ *translateY: *-\d+/)
    expect(source).toContain('flexGrow: 1')
    expect(source).toContain("justifyContent: 'center'")
  })

  it('places the guide bubble from its measured height', async () => {
    const source = await read('features/ftue/guided-spotlight.tsx')

    expect(source).toContain('onBubbleLayout')
    expect(source).toContain('event.nativeEvent.layout.height')
    // The constant survives only as the first frame's guess, never as the rule.
    expect(source).not.toContain('CARD_HEIGHT_ESTIMATE')
  })
})

describe('text scaling policy', () => {
  it('caps only the tab bar, and lets its labels wrap', async () => {
    const source = await read('features/nav/LiquidTabBar.tsx')
    const geometry = await read('features/nav/tabBarSpace.ts')

    expect(source).toContain('maxFontSizeMultiplier={CHROME_MAX_FONT_SCALE}')
    // A capped label still has to be whole, so it gets a second line.
    expect(source).toContain('numberOfLines={2}')
    // And the bar grows rather than clipping what is inside it.
    expect(source).toContain('minHeight: TAB_BAR_TRACK_HEIGHT')
    expect(geometry).toContain('export const TAB_BAR_TRACK_HEIGHT = 72')
    expect(source).not.toMatch(/\bheight: 72\b/)
  })

  it('never caps content text', async () => {
    const appText = await read('ui/AppText.tsx')

    /* AppText is every sentence in the app. A default cap here would quietly
       withhold the setting from every screen at once. */
    expect(appText).not.toContain('maxFontSizeMultiplier')
    expect(appText).not.toContain('allowFontScaling={false}')
  })

  it('drops the pinned line height once text is scaled up', async () => {
    const appText = await read('ui/AppText.tsx')
    const config = await readFile(
      fileURLToPath(new URL('../../apps/mobile/tailwind.config.js', import.meta.url)),
      'utf8',
    )

    /* The type scale pairs every size with a line height in points, and the
       platform scales font size without scaling line height. Left alone, that
       sets forty point glyphs in an eighteen point box and slices the letters
       off every heading and value in the app. */
    expect(config).toMatch(/xs: \['\d+px', '\d+px'\]/)
    expect(appText).toContain('fontScale > 1')
    expect(appText).toContain('lineHeight: undefined')
  })

  it('gives decoration a single shared threshold to step aside at', async () => {
    const policy = await read('ui/textScale.ts')

    expect(policy).toContain('hidesDecoration')
    expect(policy).toContain('CHROME_MAX_FONT_SCALE')

    for (const screen of ['app/first-meal.tsx', 'features/ftue/guided-spotlight.tsx']) {
      const source = await read(screen)
      expect(source, screen).toContain('useTextScale')
      expect(source, screen).toContain('hidesDecoration')
    }
  })
})
