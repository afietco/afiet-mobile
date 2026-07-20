import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const path = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url))

describe('information architecture', () => {
  it('offers overview, habits, and history through one screen and menu entry', async () => {
    const [screen, menu] = await Promise.all([
      readFile(path('../../apps/mobile/src/app/bilgilerim.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/nav/HamburgerMenu.tsx'), 'utf8'),
    ])

    expect(screen).toContain("{ key: 'overview', label: 'Bakış' }")
    expect(screen).toContain("{ key: 'habits', label: 'Alışkanlıklar' }")
    expect(screen).toContain("{ key: 'history', label: 'Geçmiş' }")
    expect(menu.match(/href: '\/bilgilerim'/g)).toHaveLength(1)
    expect(menu).not.toContain("href: '/aliskanliklarim'")
    expect(menu).not.toContain("href: '/gecmis'")
  })

  it('assigns Afiyet rhythm only to the Nutrition screen', async () => {
    const [nutrition, header, hero, habits] = await Promise.all([
      readFile(path('../../apps/mobile/src/app/(tabs)/beslenme.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/home/TodayHeader.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/home/NutritionCard.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/insights/habits-section.tsx'), 'utf8'),
    ])

    expect(nutrition).toContain('<RhythmHistoryCard')
    for (const source of [header, hero, habits]) {
      expect(source).not.toContain('useRhythmWeek')
      expect(source).not.toContain('<RhythmStrip')
      expect(source).not.toContain('Haftalık ritmin')
    }
  })
})
