import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPendingFirstMeal,
  mealForHour,
  parsePendingFirstMeal,
  readPendingFirstMeal,
  savePendingFirstMeal,
  syncPendingFirstMeal,
} from './pendingFirstMeal'

const { addMeal } = vi.hoisted(() => ({ addMeal: vi.fn() }))

vi.mock('../../data/repositories', () => ({ mealRepo: { add: addMeal } }))

const stored = new Map<string, string>()

beforeEach(() => {
  stored.clear()
  addMeal.mockReset()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => stored.get(key) ?? null,
    setItem: (key: string, value: string) => stored.set(key, value),
    removeItem: (key: string) => stored.delete(key),
  })
})

describe('pending first meal', () => {
  it('uses normalized catalog metadata for an accentless food name', () => {
    const entry = createPendingFirstMeal('Mercimek corbasi', new Date(2026, 6, 20, 12, 30))

    expect(entry).toMatchObject({
      foodName: 'Mercimek çorbası',
      date: '2026-07-20',
      meal: 'ogle',
      measure: 'kase',
      groups: expect.arrayContaining(['protein', 'sebze']),
    })
  })

  it('rejects malformed stored entries', () => {
    expect(parsePendingFirstMeal('{"version":1,"foodName":""}')).toBeNull()
  })

  it('selects a meal from the local hour', () => {
    expect(mealForHour(8)).toBe('kahvalti')
    expect(mealForHour(13)).toBe('ogle')
    expect(mealForHour(16)).toBe('ara')
    expect(mealForHour(19)).toBe('aksam')
  })

  it('removes the local entry only after a successful sync', async () => {
    const entry = createPendingFirstMeal('Ayran', new Date(2026, 6, 20, 13))
    savePendingFirstMeal(entry)
    addMeal.mockResolvedValue(41)

    await expect(syncPendingFirstMeal(1)).resolves.toBe(true)

    expect(addMeal).toHaveBeenCalledWith(expect.objectContaining({ foodName: 'Ayran' }))
    expect(readPendingFirstMeal()).toBeNull()
  })

  it('keeps the local entry when sync fails', async () => {
    const entry = createPendingFirstMeal('Ayran', new Date(2026, 6, 20, 13))
    savePendingFirstMeal(entry)
    addMeal.mockRejectedValue(new Error('offline'))

    await expect(syncPendingFirstMeal(1)).rejects.toThrow('offline')

    expect(readPendingFirstMeal()).toEqual(entry)
  })
})
