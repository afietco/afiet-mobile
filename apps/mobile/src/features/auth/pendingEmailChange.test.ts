import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearPendingEmailChange,
  loadPendingEmailChange,
  PENDING_EMAIL_CHANGE_STORAGE_KEY,
  savePendingEmailChange,
} from './pendingEmailChange'

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

beforeEach(() => {
  storage.values.clear()
})

describe('pending email change storage', () => {
  it('restores a waiting channel after the application restarts', async () => {
    const pending = {
      userId: 'user-1',
      channelId: 'channel-1',
      email: 'yeni@example.com',
      phase: 'waiting' as const,
    }

    await savePendingEmailChange(pending)

    expect(await loadPendingEmailChange('user-1')).toEqual(pending)
  })

  it('preserves the uncertain finalization phase without deleting the channel', async () => {
    await savePendingEmailChange({
      userId: 'user-1',
      channelId: 'channel-1',
      email: 'yeni@example.com',
      phase: 'finalizing',
    })

    expect(await loadPendingEmailChange('user-1')).toMatchObject({ phase: 'finalizing' })
    expect(storage.values.has(PENDING_EMAIL_CHANGE_STORAGE_KEY)).toBe(true)
  })

  it('drops invalid or cross-account state', async () => {
    await savePendingEmailChange({
      userId: 'user-1',
      channelId: 'channel-1',
      email: 'yeni@example.com',
      phase: 'waiting',
    })

    expect(await loadPendingEmailChange('user-2')).toBeNull()
    expect(storage.values.has(PENDING_EMAIL_CHANGE_STORAGE_KEY)).toBe(false)

    await clearPendingEmailChange()
  })
})
