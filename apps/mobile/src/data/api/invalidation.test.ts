import { describe, expect, it } from 'vitest'
import { invalidationTargets } from './invalidation'

/** Targets are prefixes, so this asks the question the cache actually asks. */
function invalidates(mutation: string, readPath: string): boolean {
  const targets = invalidationTargets(mutation)
  if (targets === null) return true
  return targets.some((prefix) => readPath.startsWith(prefix))
}

describe('mutation invalidation targets', () => {
  it('refreshes the day and every derived surface after a meal', () => {
    for (const read of [
      '/v1/meals?date=2026-08-02',
      '/v1/meals/logged-dates',
      '/v1/summary?date=2026-08-02',
      '/v1/summary/week?date=2026-08-02',
      '/v1/progress',
      '/v1/league',
      '/v1/quests',
      '/v1/kese',
      '/v1/friends?date=2026-08-02',
    ]) {
      expect(invalidates('/v1/meals', read), read).toBe(true)
    }
  })

  it('matches a meal edit and a delete by their id-bearing paths', () => {
    expect(invalidates('/v1/meals/abc-123', '/v1/summary?date=2026-08-02')).toBe(true)
  })

  it('leaves unrelated reads alone when water is logged', () => {
    expect(invalidates('/v1/water', '/v1/water?date=2026-08-02')).toBe(true)
    expect(invalidates('/v1/water', '/v1/summary?date=2026-08-02')).toBe(true)
    expect(invalidates('/v1/water', '/v1/sofras')).toBe(false)
    expect(invalidates('/v1/water', '/v1/custom-foods')).toBe(false)
    expect(invalidates('/v1/water', '/v1/notifications')).toBe(false)
  })

  it('refreshes the summary after a custom food changes, since days sum its macros', () => {
    expect(invalidates('/v1/custom-foods/abc', '/v1/summary?date=2026-08-02')).toBe(true)
    expect(invalidates('/v1/custom-foods/abc', '/v1/custom-foods')).toBe(true)
    expect(invalidates('/v1/custom-foods/abc', '/v1/measurements')).toBe(false)
  })

  it('treats a friend request as touching the lookups that carry friendStatus', () => {
    expect(invalidates('/v1/friends/requests/abc/accept', '/v1/friends')).toBe(true)
    expect(invalidates('/v1/friends/requests/abc/accept', '/v1/users/search?q=ada')).toBe(true)
    expect(invalidates('/v1/friends/requests/abc/accept', '/v1/users/by-code/ABCD1234')).toBe(true)
  })

  it('refreshes standings when group membership changes', () => {
    expect(invalidates('/v1/groups/join', '/v1/groups')).toBe(true)
    expect(invalidates('/v1/groups/abc/members/me', '/v1/league')).toBe(true)
    expect(invalidates('/v1/groups/abc/greetings', '/v1/quests')).toBe(true)
  })

  it('claims a quest without disturbing the meal log', () => {
    expect(invalidates('/v1/quests/ilk-ogun/claim', '/v1/kese')).toBe(true)
    expect(invalidates('/v1/quests/ilk-ogun/claim', '/v1/progress')).toBe(true)
    expect(invalidates('/v1/quests/ilk-ogun/claim', '/v1/meals?date=2026-08-02')).toBe(false)
  })

  it('prefers the most specific rule when prefixes overlap', () => {
    // '/v1/summary/week/closure/ack' must not fall through to the catch-all.
    expect(invalidationTargets('/v1/summary/week/closure/ack')).toEqual(['/v1/summary'])
  })

  it('declares the writes that change nothing anyone reads back', () => {
    expect(invalidationTargets('/v1/push/devices/current')).toEqual([])
    expect(invalidationTargets('/v1/afi/food-suggest')).toEqual([])
    expect(invalidationTargets('/v1/afi/besin-ayikla')).toEqual([])
  })

  it('ends every read when the account is deleted', () => {
    expect(invalidationTargets('/v1/account')).toBeNull()
  })

  it('falls back to invalidating everything for an endpoint with no rule', () => {
    expect(invalidationTargets('/v1/something-new-nobody-mapped')).toBeNull()
  })

  it('ignores query strings, because rules are about endpoints not arguments', () => {
    expect(invalidationTargets('/v1/water?date=2026-08-02')).toEqual(
      invalidationTargets('/v1/water'),
    )
  })
})
