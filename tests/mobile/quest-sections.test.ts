import { describe, expect, it } from 'vitest'
import type { ApiQuest } from '../../apps/mobile/src/data/api/client'
import { questSections } from '../../apps/mobile/src/features/progress/quests'

// docs/12 görünürlük kuralı: sürmekte olanlardan her metrik grubunun YALNIZ
// en yakın eşiği gösterilir, yoksa ekran bir kontrol listesine döner.

function quest(partial: Partial<ApiQuest> & { key: string; group: string }): ApiQuest {
  return {
    title: partial.key,
    detail: '',
    emoji: '🌱',
    target: 10,
    progress: 0,
    xpReward: 10,
    completed: false,
    claimed: false,
    ...partial,
  }
}

describe('questSections', () => {
  it('separates claimable, active and claimed', () => {
    const { claimable, active, claimed } = questSections([
      quest({ key: 'a', group: 'afiyet_day', completed: true }),
      quest({ key: 'b', group: 'distinct_food', progress: 3 }),
      quest({ key: 'c', group: 'measurement', completed: true, claimed: true }),
    ])
    expect(claimable.map((q) => q.key)).toEqual(['a'])
    expect(active.map((q) => q.key)).toEqual(['b'])
    expect(claimed.map((q) => q.key)).toEqual(['c'])
  })

  it('shows only the nearest threshold per group among active quests', () => {
    const { active } = questSections([
      quest({ key: 'day-7', group: 'afiyet_day', target: 7, progress: 3 }),
      quest({ key: 'day-30', group: 'afiyet_day', target: 30, progress: 3 }),
      quest({ key: 'day-100', group: 'afiyet_day', target: 100, progress: 3 }),
    ])
    expect(active.map((q) => q.key)).toEqual(['day-7'])
  })

  it('reveals the next threshold once the nearest is completed', () => {
    // 7 tamamlanıp claimable'a geçtiğinde, aktifte grubun en yakını 30 olur.
    const { claimable, active } = questSections([
      quest({ key: 'day-7', group: 'afiyet_day', target: 7, progress: 7, completed: true }),
      quest({ key: 'day-30', group: 'afiyet_day', target: 30, progress: 7 }),
    ])
    expect(claimable.map((q) => q.key)).toEqual(['day-7'])
    expect(active.map((q) => q.key)).toEqual(['day-30'])
  })

  it('orders active groups by how close they are to their threshold', () => {
    const { active } = questSections([
      quest({ key: 'far', group: 'afiyet_day', target: 100, progress: 10 }), // kalan 90
      quest({ key: 'near', group: 'distinct_food', target: 10, progress: 8 }), // kalan 2
    ])
    expect(active.map((q) => q.key)).toEqual(['near', 'far'])
  })
})
