import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPendingJoin,
  consumePendingJoin,
  loadPendingJoin,
  onPendingJoin,
  peekPendingJoin,
  PENDING_JOIN_STORAGE_KEY,
  PENDING_JOIN_TTL_MS,
  setPendingJoin,
} from './pendingJoin'

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

beforeEach(async () => {
  await clearPendingJoin()
  storage.values.clear()
})

afterEach(async () => {
  await clearPendingJoin()
})

describe('pending group invitation', () => {
  it('preserves safe display context and persists it until consumption', async () => {
    await setPendingJoin('abc12345', {
      groupName: ' Aile Sofrası ',
      inviterName: ' Ayşe ',
    })

    expect(peekPendingJoin()).toEqual({
      code: 'ABC12345',
      groupName: 'Aile Sofrası',
      inviterName: 'Ayşe',
    })
    expect(consumePendingJoin()).toBe('ABC12345')
    expect(peekPendingJoin()).toBeNull()
    await loadPendingJoin()
    expect(peekPendingJoin()).toBeNull()
  })

  it('hydrates a valid invitation within the short TTL', async () => {
    const now = Date.parse('2026-07-20T12:00:00.000Z')
    await storage.setItem(
      PENDING_JOIN_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        expiresAt: now + PENDING_JOIN_TTL_MS,
        invite: { code: 'ABC12345', groupName: 'Aile Sofrası', inviterName: 'Ayşe' },
      }),
    )

    await loadPendingJoin(now)

    expect(peekPendingJoin(now)).toEqual({
      code: 'ABC12345',
      groupName: 'Aile Sofrası',
      inviterName: 'Ayşe',
    })
  })

  it('removes invitations after the TTL expires', async () => {
    const now = Date.parse('2026-07-20T12:00:00.000Z')
    await storage.setItem(
      PENDING_JOIN_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        expiresAt: now - 1,
        invite: { code: 'ABC12345', groupName: null, inviterName: null },
      }),
    )

    await loadPendingJoin(now)

    expect(peekPendingJoin()).toBeNull()
    expect(storage.values.has(PENDING_JOIN_STORAGE_KEY)).toBe(false)
  })

  it('rejects invalid codes and notifies invitation listeners', async () => {
    const listener = vi.fn()
    const unsubscribe = onPendingJoin(listener)

    await setPendingJoin('short', { inviterName: 'Ayşe' })

    expect(peekPendingJoin()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })
})
