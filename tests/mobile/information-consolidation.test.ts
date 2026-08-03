import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const path = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url))

describe('information architecture', () => {
  it('offers every reading through one screen and one menu entry', async () => {
    const [screen, menu] = await Promise.all([
      readFile(path('../../apps/mobile/src/app/bilgilerim.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/nav/HamburgerMenu.tsx'), 'utf8'),
    ])

    /* Pinned by key rather than by label. The point of this test is that these
       readings live behind one door, which is a structural claim; the words on
       the tabs are copy and have already been shortened once to fit four of
       them on a phone. */
    for (const key of ['overview', 'nutrition', 'habits', 'history']) {
      expect(screen).toContain(`key: '${key}'`)
    }
    for (const section of ['OverviewSection', 'NutritionSection', 'HabitsSection', 'HistorySection']) {
      expect(screen).toContain(`<${section} />`)
    }
    expect(menu.match(/href: '\/bilgilerim'/g)).toHaveLength(1)
    expect(menu).not.toContain("href: '/aliskanliklarim'")
    expect(menu).not.toContain("href: '/gecmis'")
  })

  // Karar revizyonu (24 Tem 2026, ürün sahibi): ritim şeridi Bugün'e GERİ
  // getirildi. Bölüşüm artık şöyle: göz-ucu şerit (bu haftanın günleri) Bugün'ün
  // Beslenme kahramanında, AYRINTILI geçmiş (hafta hafta döküm + toplam afiyet
  // haftası) Beslenme ekranında. Deniz'in geri bildirimi ("devam ettiğimi
  // göremiyorum") bu şeridin yokluğundan geliyordu.
  it('splits Afiyet rhythm: strip on Today, detailed history on Nutrition', async () => {
    const [nutrition, header, hero, habits] = await Promise.all([
      readFile(path('../../apps/mobile/src/app/(tabs)/beslenme.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/home/TodayHeader.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/home/NutritionCard.tsx'), 'utf8'),
      readFile(path('../../apps/mobile/src/features/insights/habits-section.tsx'), 'utf8'),
    ])

    // Ayrıntılı döküm yalnız Beslenme'de.
    expect(nutrition).toContain('<RhythmHistoryCard')
    for (const source of [header, habits]) {
      expect(source).not.toContain('<RhythmHistoryCard')
    }

    // Göz-ucu şerit Bugün'ün kahraman kartında, hero varyantıyla.
    expect(hero).toContain('<RhythmStrip')
    expect(hero).toContain('useRhythmWeek')

    // Selamlama başlığı ve alışkanlıklar bölümü ritim taşımaz.
    for (const source of [header, habits]) {
      expect(source).not.toContain('<RhythmStrip')
      expect(source).not.toContain('Haftalık ritmin')
    }
  })
})
