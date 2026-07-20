import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  new URL('../../apps/mobile/src/features/home/NutritionCard.tsx', import.meta.url),
  'utf8',
)

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
})
