import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('../../apps/mobile/src/features/home/NutritionCard.tsx', import.meta.url),
  'utf8',
)

function channels(hex: string): number[] {
  return hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => Number.parseInt(part, 16))
}

function relativeLuminance(hex: string): number {
  const linear = channels(hex)
    .map((channel) => channel / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    )
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

function contrastRatio(foreground: string, background: string): number {
  const values = [relativeLuminance(foreground), relativeLuminance(background)].sort(
    (left, right) => right - left,
  )
  return (values[0] + 0.05) / (values[1] + 0.05)
}

function blendWithWhite(background: string, opacity: number): string {
  return `#${channels(background)
    .map((channel) => Math.round(channel * (1 - opacity) + 255 * opacity))
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`
}

describe('NutritionCard accessibility structure', () => {
  it('keeps navigation and add-food actions as sibling accessibility elements', () => {
    const rootStart = source.indexOf('return (\n    <View')
    const detailAction = source.indexOf('accessibilityLabel="Beslenme detayını aç"')
    const addAction = source.indexOf('accessibilityLabel="Besin ekle"')

    expect(rootStart).toBeGreaterThan(-1)
    expect(detailAction).toBeGreaterThan(rootStart)
    expect(addAction).toBeGreaterThan(detailAction)
    expect(source).not.toMatch(/return \(\s*<Pressable[\s\S]*?onLayout=/)
  })

  it('keeps white hero-card labels above AA contrast across the gradient', () => {
    const stops = [...source.matchAll(/<Stop[^>]+stopColor="(#[0-9a-fA-F]{6})"/g)].map(
      (match) => match[1],
    )

    expect(stops).toHaveLength(3)
    expect(source).toContain('bg-emerald-800')
    expect(source).toContain('bg-black/10')
    for (const stop of stops) {
      expect(contrastRatio('#ffffff', stop)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio('#ffffff', blendWithWhite(stop, 0.2))).toBeGreaterThanOrEqual(4.5)
    }
  })
})
