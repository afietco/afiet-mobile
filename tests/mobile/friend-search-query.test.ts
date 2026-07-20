import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { normalizeFriendSearchQuery } from '../../apps/mobile/src/features/social/friendSearchQuery'

const addFriendSheet = readFileSync(
  new URL('../../apps/mobile/src/features/social/AddFriendSheet.tsx', import.meta.url),
  'utf8',
)

describe('friend search query normalization', () => {
  it('removes leading @ markers and surrounding whitespace', () => {
    expect(normalizeFriendSearchQuery('@kullanici')).toBe('kullanici')
    expect(normalizeFriendSearchQuery('  @@kullanici  ')).toBe('kullanici')
  })

  it('does not alter @ characters inside the username query', () => {
    expect(normalizeFriendSearchQuery('kullan@ici')).toBe('kullan@ici')
  })

  it('uses the normalized query for validation and the API call', () => {
    expect(addFriendSheet.match(/normalizeFriendSearchQuery\(query\)/g)).toHaveLength(2)
    expect(addFriendSheet).toContain('searchUsers(q)')
  })
})
