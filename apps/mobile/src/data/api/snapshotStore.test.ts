import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearSnapshots,
  configureSnapshotStore,
  hydrateSnapshots,
  readSnapshot,
  settleSnapshots,
  SNAPSHOT_MAX_AGE_MS,
  writeSnapshot,
} from './snapshotStore'

const storage = vi.hoisted(() => {
  const values = new Map<string, string>()
  return {
    values,
    getItem: vi.fn(async (key: string) => values.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      values.set(key, value)
    }),
    removeItem: vi.fn(async (key: string) => {
      values.delete(key)
    }),
  }
})

vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }))

let clock = 1_000_000

beforeEach(async () => {
  await clearSnapshots()
  storage.values.clear()
  clock = 1_000_000
  configureSnapshotStore({ now: () => clock })
})

describe('response snapshot store', () => {
  it('serves a value written in an earlier session', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/summary?date=2026-08-02', { streak: 4 })
    await settleSnapshots()

    // Hydrating again reads from storage, which is what a fresh launch does.
    await hydrateSnapshots('user-a')

    expect(readSnapshot('/v1/summary?date=2026-08-02')).toEqual({ streak: 4 })
  })

  it('never serves one account a value written by another', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/profile', { displayName: 'Ada' })
    await settleSnapshots()

    await hydrateSnapshots('user-b')

    expect(readSnapshot('/v1/profile')).toBeUndefined()
  })

  it('forgets everything on sign-out, in memory and on disk', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/profile', { displayName: 'Ada' })
    await settleSnapshots()

    await clearSnapshots()
    expect(readSnapshot('/v1/profile')).toBeUndefined()

    await hydrateSnapshots('user-a')
    expect(readSnapshot('/v1/profile')).toBeUndefined()
  })

  it('ignores entries past the staleness ceiling', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/league', { tier: 'tarcin' })
    await settleSnapshots()

    clock += SNAPSHOT_MAX_AGE_MS + 1
    expect(readSnapshot('/v1/league')).toBeUndefined()
  })

  it('drops stale entries when hydrating rather than carrying them forward', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/league', { tier: 'tarcin' })
    writeSnapshot('/v1/profile', { displayName: 'Ada' })
    await settleSnapshots()

    // A launch a week later: the league entry is past the ceiling on arrival.
    clock += SNAPSHOT_MAX_AGE_MS + 1
    await hydrateSnapshots('user-a')
    expect(readSnapshot('/v1/league')).toBeUndefined()

    /* Pruned at hydration, not merely hidden by the clock: rewinding time
       cannot bring it back, while an entry written after the rewind can. */
    clock -= SNAPSHOT_MAX_AGE_MS + 1
    expect(readSnapshot('/v1/league')).toBeUndefined()
    expect(readSnapshot('/v1/profile')).toBeUndefined()
  })

  it('refuses to store search and assistant traffic', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/users/search?q=ada', { results: [] })
    writeSnapshot('/v1/groups/discover', { groups: [] })
    writeSnapshot('/v1/afi/photo-chat', { reply: 'merhaba' })

    expect(readSnapshot('/v1/users/search?q=ada')).toBeUndefined()
    expect(readSnapshot('/v1/groups/discover')).toBeUndefined()
    expect(readSnapshot('/v1/afi/photo-chat')).toBeUndefined()
  })

  it('evicts the least recently written entry once the count cap is passed', async () => {
    await hydrateSnapshots('user-a')
    for (let i = 0; i < 64; i++) writeSnapshot(`/v1/meals?date=${i}`, { i })

    // Touching the oldest key again moves it to the tail of the LRU order.
    writeSnapshot('/v1/meals?date=0', { i: 0, touched: true })
    writeSnapshot('/v1/meals?date=999', { i: 999 })

    expect(readSnapshot('/v1/meals?date=0')).toEqual({ i: 0, touched: true })
    expect(readSnapshot('/v1/meals?date=999')).toEqual({ i: 999 })
    expect(readSnapshot('/v1/meals?date=1')).toBeUndefined()
  })

  it('skips an entry too large to be worth storing', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/meals', { blob: 'x'.repeat(64 * 1024) })

    expect(readSnapshot('/v1/meals')).toBeUndefined()
  })

  it('writes nothing while no account is bound', async () => {
    writeSnapshot('/v1/profile', { displayName: 'Ada' })
    await settleSnapshots()

    expect(readSnapshot('/v1/profile')).toBeUndefined()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('starts empty instead of throwing when the stored blob is corrupt', async () => {
    storage.values.set('fh:snap:account:user-a', '{not json')

    await hydrateSnapshots('user-a')

    expect(readSnapshot('/v1/profile')).toBeUndefined()
  })

  it('does not let a flush scheduled before sign-out rewrite storage after it', async () => {
    await hydrateSnapshots('user-a')
    writeSnapshot('/v1/profile', { displayName: 'Ada' })

    await clearSnapshots()
    await settleSnapshots()

    expect(storage.values.get('fh:snap:account:user-a')).toBeUndefined()
  })
})
