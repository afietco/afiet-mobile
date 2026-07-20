import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const visibleMealSources = [
  '../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx',
  '../../apps/mobile/src/features/insights/history-section.tsx',
]

describe('saved meal amount visibility', () => {
  it.each(visibleMealSources)('renders the saved quantity in %s', async (path) => {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')

    expect(source).toContain('formatMealAmount(e)')
  })
})
