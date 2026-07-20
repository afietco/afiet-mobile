import { describe, expect, it } from 'vitest'
import { ACTIVITY_LEVELS, SPORT_ACTIVITIES } from '../src/types'

describe('profile preferences', () => {
  it('describes daily movement without using exercise frequency', () => {
    for (const level of ACTIVITY_LEVELS) {
      expect(level.description).not.toMatch(/egzersiz|antrenman/i)
    }
  })

  it('keeps sport activity keys unique', () => {
    const keys = SPORT_ACTIVITIES.map((sport) => sport.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
