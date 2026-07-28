import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const layoutPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/(tabs)/_layout.tsx', import.meta.url),
)
const tabBarPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/nav/animated-tab-bar.tsx', import.meta.url),
)
const themePath = fileURLToPath(
  new URL('../../apps/mobile/src/theme/useTheme.ts', import.meta.url),
)

function token(source: string, theme: 'light' | 'dark', name: string): string {
  const themeBlock = source.match(new RegExp(`${theme}: \\{([\\s\\S]*?)\\n  \\}`))?.[1]
  const value = themeBlock?.match(new RegExp(`${name}: '(#[0-9a-fA-F]{6})'`))?.[1]
  if (!value) throw new Error(`Missing ${theme}.${name} color token`)
  return value
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(foreground: string, background: string): number {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (left, right) => right - left,
  )
  return (values[0] + 0.05) / (values[1] + 0.05)
}

describe('tab bar accessibility', () => {
  it('keeps inactive labels above 4.5:1 contrast in both themes', async () => {
    const [tabBar, theme] = await Promise.all([
      readFile(tabBarPath, 'utf8'),
      readFile(themePath, 'utf8'),
    ])

    expect(tabBar).toContain("focused ? ACTIVE_COLOR : t.ink")
    for (const mode of ['light', 'dark'] as const) {
      const ratio = contrastRatio(token(theme, mode, 'ink'), token(theme, mode, 'surface'))
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('exposes semantic tabs and allows system font scaling', async () => {
    const tabBar = await readFile(tabBarPath, 'utf8')

    expect(tabBar).toContain('accessibilityRole="tab"')
    expect(tabBar).toContain('accessibilityState={{ selected: focused, disabled: locked }}')
    expect(tabBar).toContain('allowFontScaling')
  })

  it('animates the selected capsule, and leaves the scenes alone', async () => {
    const [layout, tabBar] = await Promise.all([
      readFile(layoutPath, 'utf8'),
      readFile(tabBarPath, 'utf8'),
    ])

    expect(layout).toContain('tabBar={(props) => <AnimatedTabBar')
    expect(tabBar).toContain('selectedIndex.value = withSpring(state.index')
    expect(tabBar).toContain('translateX: selectedIndex.value * itemWidth')

    /* The capsule carries the transition; the scenes must not. A cross fade
       between tab screens is the one option here that can leave a screen
       mounted at zero opacity, which reads as a blank tab with a working tab
       bar. Reintroducing it needs a device check on a real build first. */
    expect(layout).not.toContain("animation: 'fade'")
  })

  it('gives every tab a boundary so a thrown screen is never blank', async () => {
    /* Without one the subtree unmounts and the content area goes white with
       nothing to tap, and a release build shows no error to explain it. */
    for (const tab of ['index', 'beslenme', 'vucudum', 'grubum']) {
      const source = await readFile(
        new URL(`../../apps/mobile/src/app/(tabs)/${tab}.tsx`, import.meta.url),
        'utf8',
      )
      expect(source).toContain('ScreenErrorBoundary as ErrorBoundary')
    }
  })
})
