import { describe, expect, it } from 'vitest'
import { resolveStoredDirection } from '../../apps/mobile/src/data/repositories/goalDirectionStorage'

/**
 * A retired direction has to be translated, never dropped.
 *
 * The row guard throws away anything it does not recognise, and for a
 * direction log that is not a clean slate: it silently demotes somebody who
 * answered the question to the unanswered default, which then reads as "never
 * chose" everywhere and moves their targets without anybody asking them.
 */
describe('resolveStoredDirection', () => {
  it('keeps the directions still on offer', () => {
    for (const key of ['hafifle', 'donusum', 'koru', 'duzen']) {
      expect(resolveStoredDirection(key)).toBe(key)
    }
  })

  /* 'guclen' left because its question lives on the activity side. 'donusum'
     is the nearest thing still offered: the other direction that holds weight
     steady while asking for the higher protein band. */
  it('translates a retired direction instead of losing it', () => {
    expect(resolveStoredDirection('guclen')).toBe('donusum')
  })

  it('still refuses a value that never meant anything', () => {
    expect(resolveStoredDirection('zımbırtı')).toBeNull()
    expect(resolveStoredDirection(7)).toBeNull()
    expect(resolveStoredDirection(undefined)).toBeNull()
  })
})
