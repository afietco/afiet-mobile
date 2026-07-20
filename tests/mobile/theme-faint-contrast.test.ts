import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const themeUrl = new URL('../../apps/mobile/src/theme/useTheme.ts', import.meta.url)
const cssUrl = new URL('../../apps/mobile/src/global.css', import.meta.url)

function themeToken(source: string, theme: 'light' | 'dark', name: string): string {
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

function hexToRgbTriplet(hex: string): string {
  return hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => Number.parseInt(part, 16))
    .join(' ')
}

describe('faint text contrast', () => {
  it('meets WCAG AA against common backgrounds in both themes', async () => {
    const theme = await readFile(themeUrl, 'utf8')

    for (const mode of ['light', 'dark'] as const) {
      const faint = themeToken(theme, mode, 'faint')
      for (const background of ['canvas', 'surface', 'muted']) {
        expect(contrastRatio(faint, themeToken(theme, mode, background))).toBeGreaterThanOrEqual(
          4.5,
        )
      }
    }
  })

  it('keeps NativeWind and TypeScript faint tokens synchronized', async () => {
    const [theme, css] = await Promise.all([readFile(themeUrl, 'utf8'), readFile(cssUrl, 'utf8')])
    const light = hexToRgbTriplet(themeToken(theme, 'light', 'faint'))
    const dark = hexToRgbTriplet(themeToken(theme, 'dark', 'faint'))

    expect(css).toContain(`:root {`)
    expect(css).toContain(`--c-faint: ${light};`)
    expect(css).toMatch(new RegExp(`\\.dark:root \\{[\\s\\S]*--c-faint: ${dark};`))
  })
})
