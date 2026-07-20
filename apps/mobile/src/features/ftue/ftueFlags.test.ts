import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ftueSeen,
  loadFtueAccountFlags,
  loadFtueFlags,
  markFtueSeen,
  resetFtueFlags,
} from './ftueFlags'

const storage = vi.hoisted(() => {
  const values = new Map<string, string>()
  return {
    values,
    multiGet: vi.fn(async (keys: string[]) =>
      keys.map((key) => [key, values.get(key) ?? null] as [string, string | null]),
    ),
    setItem: vi.fn(async (key: string, value: string) => {
      values.set(key, value)
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      keys.forEach((key) => values.delete(key))
    }),
  }
})

vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }))

beforeEach(async () => {
  await resetFtueFlags()
  storage.values.clear()
})

describe('account-scoped FTUE flags', () => {
  it('does not expose one account guide completion to another account', async () => {
    await loadFtueAccountFlags('user-a')
    markFtueSeen('afiGuideDone')
    expect(ftueSeen('afiGuideDone')).toBe(true)

    await loadFtueAccountFlags('user-b')
    expect(ftueSeen('afiGuideDone')).toBe(false)

    await loadFtueAccountFlags('user-a')
    expect(ftueSeen('afiGuideDone')).toBe(true)
  })

  it('ignores stale account writes after sign-out', async () => {
    await loadFtueAccountFlags('user-a')
    await resetFtueFlags()

    markFtueSeen('afiGuideDone')

    expect(ftueSeen('afiGuideDone')).toBe(false)
  })

  it('keeps pre-authentication flags available without an account scope', async () => {
    await loadFtueFlags()
    markFtueSeen('welcomeIntro')

    expect(ftueSeen('welcomeIntro')).toBe(true)
  })
})
