import { describe, expect, it } from 'vitest'
import type { ApiQuest } from '@/data/api/client'
import { questAction, questCounter, questNarration, questRemaining } from './questGuide'

const quest = (over: Partial<ApiQuest> = {}): ApiQuest => ({
  key: 'yedi-afiyet-gunu',
  title: 'Yedi afiyet günü',
  detail: 'Toplam 7 afiyet günü',
  emoji: '🌿',
  target: 7,
  progress: 4,
  xpReward: 10,
  group: 'afiyet_day',
  completed: false,
  claimed: false,
  ...over,
})

describe('questNarration', () => {
  it('prefers the narration the server wrote', () => {
    expect(questNarration(quest({ narration: 'Günlerin arka arkaya olmak zorunda değil.' }))).toBe(
      'Günlerin arka arkaya olmak zorunda değil.',
    )
  })

  // The column was added after the field shipped, so an older server sends no
  // narration at all and the detail is the only sentence there is.
  it('falls back to the detail when the server sends none', () => {
    expect(questNarration(quest())).toBe('Toplam 7 afiyet günü')
  })

  it('treats a blank narration as absent', () => {
    expect(questNarration(quest({ narration: '   ' }))).toBe('Toplam 7 afiyet günü')
  })
})

describe('questAction', () => {
  it('sends every food metric to the add-food sheet on Bugün', () => {
    for (const group of ['afiyet_day', 'afiyet_week', 'distinct_food', 'distinct_group']) {
      expect(questAction(quest({ group }))?.href).toEqual({
        pathname: '/(tabs)',
        params: { pushTarget: 'meal' },
      })
    }
  })

  it('routes the non-food metrics to the screen that owns them', () => {
    expect(questAction(quest({ group: 'custom_food' }))?.href).toBe('/menum')
    expect(questAction(quest({ group: 'group_join' }))?.href).toBe('/grubum')
    expect(questAction(quest({ group: 'greeting' }))?.href).toBe('/grubum')
    expect(questAction(quest({ group: 'measurement' }))?.href).toBe('/vucudum')
  })

  // Metrics are an admin-editable enum, so a quest can arrive on a metric this
  // build has never seen. The detail must still open; it just has no starter.
  it('returns null for a metric it does not know', () => {
    expect(questAction(quest({ group: 'rainbow_week' }))).toBeNull()
  })
})

describe('questCounter', () => {
  it('counts progress while the quest is running', () => {
    expect(questCounter(quest())).toBe('4 / 7')
  })

  /* Progress is derived from data that can move on: a claimed quest whose
     counter has since drifted would otherwise read "3 / 7" under a tick. */
  it('pins a finished quest to its target', () => {
    expect(questCounter(quest({ progress: 3, claimed: true }))).toBe('7 / 7')
    expect(questCounter(quest({ progress: 3, completed: true }))).toBe('7 / 7')
  })
})

describe('questRemaining', () => {
  it('names the unit of the metric', () => {
    expect(questRemaining(quest())).toBe('Kalan 3 gün')
    expect(questRemaining(quest({ group: 'distinct_group', target: 12, progress: 9 }))).toBe(
      'Kalan 3 besin grubu',
    )
  })

  it('says nothing once the quest is finished', () => {
    expect(questRemaining(quest({ completed: true }))).toBeNull()
    expect(questRemaining(quest({ claimed: true }))).toBeNull()
  })

  // Guessing a unit is worse than omitting the line: "kalan 3 gün" under a
  // quest that counts something else is a wrong answer, not a missing one.
  it('says nothing when it does not know the unit', () => {
    expect(questRemaining(quest({ group: 'group_join', target: 1, progress: 0 }))).toBeNull()
  })
})
