import type { GoalDirection, GoalDirectionRow } from '@afiet/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_GOAL_DIRECTION,
  activeDirectionRow,
  buildDirectionRow,
  nextEffectiveFrom,
  pendingDirection,
  resolveDirection,
} from '../../apps/mobile/src/features/goals/goalDirection'
import { subscribe } from '../../apps/mobile/src/data/live'
import {
  clearGoalDirections,
  goalDirectionRepo,
} from '../../apps/mobile/src/data/repositories/goalDirectionStorage'

const memory = vi.hoisted(() => new Map<string, string>())

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      memory.set(key, value)
    },
    getAllKeys: async () => [...memory.keys()],
    multiRemove: async (keys: string[]) => {
      for (const key of keys) memory.delete(key)
    },
  },
}))

let sequence = 0

function row(
  direction: GoalDirection,
  effectiveFrom: string,
  createdAt = `2026-01-01T00:00:${String(sequence % 60).padStart(2, '0')}.000Z`,
): GoalDirectionRow {
  sequence += 1
  return { id: sequence, profileId: 12, direction, effectiveFrom, createdAt }
}

describe('nextEffectiveFrom', () => {
  it('returns the coming Monday for a mid week choice', () => {
    // 2026-07-29 is a Wednesday.
    expect(nextEffectiveFrom('2026-07-29')).toBe('2026-08-03')
    // 2026-08-02 is the Sunday closing the same week.
    expect(nextEffectiveFrom('2026-08-02')).toBe('2026-08-03')
  })

  it('skips to the following Monday when today is already Monday', () => {
    // A direction never takes effect on the day it is chosen.
    expect(nextEffectiveFrom('2026-08-03')).toBe('2026-08-10')
  })

  it('always lands strictly in the future and on a Monday', () => {
    for (let day = 1; day <= 31; day++) {
      const today = `2026-07-${String(day).padStart(2, '0')}`
      const start = nextEffectiveFrom(today)
      expect(start > today).toBe(true)
      expect(new Date(`${start}T00:00:00`).getDay()).toBe(1)
    }
  })
})

describe('resolveDirection', () => {
  it('falls back to the default when no row exists', () => {
    expect(resolveDirection([], '2026-07-29')).toBe('duzen')
    expect(resolveDirection([], '2026-07-29')).toBe(DEFAULT_GOAL_DIRECTION)
    expect(activeDirectionRow([], '2026-07-29')).toBeUndefined()
  })

  it('picks the latest row that has already started', () => {
    const rows = [row('koru', '2026-06-01'), row('hafifle', '2026-07-06'), row('guclen', '2026-07-20')]
    expect(resolveDirection(rows, '2026-07-29')).toBe('guclen')
    expect(activeDirectionRow(rows, '2026-07-29')?.effectiveFrom).toBe('2026-07-20')
  })

  it('ignores storage order', () => {
    const rows = [row('guclen', '2026-07-20'), row('koru', '2026-06-01'), row('hafifle', '2026-07-06')]
    expect(resolveDirection(rows, '2026-07-10')).toBe('hafifle')
  })

  it('does not apply a row dated in the future', () => {
    const rows = [row('koru', '2026-06-01'), row('hafifle', '2026-08-03')]
    expect(resolveDirection(rows, '2026-07-29')).toBe('koru')
    // The same list read on the Monday the row starts flips without any job run.
    expect(resolveDirection(rows, '2026-08-03')).toBe('hafifle')
  })

  it('answers for a past date so calibration can look back', () => {
    const rows = [row('koru', '2026-06-01'), row('hafifle', '2026-07-06'), row('guclen', '2026-07-20')]
    expect(resolveDirection(rows, '2026-07-15')).toBe('hafifle')
    expect(resolveDirection(rows, '2026-06-30')).toBe('koru')
    // Before the first row there is no history, so the default applies.
    expect(resolveDirection(rows, '2026-05-31')).toBe('duzen')
  })

  it('lets the later choice win when two rows share a start date', () => {
    const rows = [
      row('koru', '2026-06-01', '2026-05-20T10:00:00.000Z'),
      row('hafifle', '2026-08-03', '2026-07-28T09:00:00.000Z'),
      row('donusum', '2026-08-03', '2026-07-30T09:00:00.000Z'),
    ]
    expect(resolveDirection(rows, '2026-08-03')).toBe('donusum')
  })
})

describe('pendingDirection', () => {
  it('reports a row waiting for its Monday', () => {
    const rows = [row('koru', '2026-06-01'), row('hafifle', '2026-08-03')]
    expect(pendingDirection(rows, '2026-07-29')).toEqual({
      direction: 'hafifle',
      effectiveFrom: '2026-08-03',
    })
  })

  it('reports nothing once the row has started', () => {
    const rows = [row('koru', '2026-06-01'), row('hafifle', '2026-08-03')]
    expect(pendingDirection(rows, '2026-08-03')).toBeNull()
    expect(pendingDirection([], '2026-07-29')).toBeNull()
  })

  it('reports nothing when the queued row repeats the active direction', () => {
    const rows = [
      row('koru', '2026-06-01', '2026-05-20T10:00:00.000Z'),
      row('hafifle', '2026-08-03', '2026-07-28T09:00:00.000Z'),
      row('koru', '2026-08-03', '2026-07-30T09:00:00.000Z'),
    ]
    expect(pendingDirection(rows, '2026-07-29')).toBeNull()
  })
})

describe('goalDirectionRepo on AsyncStorage', () => {
  const storageKey = 'fh:goalDirections:12'

  beforeEach(() => {
    memory.clear()
  })

  it('reads an empty log for a profile that has never chosen', async () => {
    expect(await goalDirectionRepo.forProfile(12)).toEqual([])
  })

  it('appends rows under an fh key keyed by profile', async () => {
    await goalDirectionRepo.add({
      profileId: 12,
      direction: 'koru',
      effectiveFrom: '2026-06-01',
      createdAt: '2026-05-27T10:00:00.000Z',
    })
    await goalDirectionRepo.add({
      profileId: 12,
      direction: 'hafifle',
      effectiveFrom: '2026-08-03',
      createdAt: '2026-07-29T18:30:00.000Z',
    })

    expect([...memory.keys()]).toEqual([storageKey])
    const rows = await goalDirectionRepo.forProfile(12)
    expect(rows.map((row) => row.direction)).toEqual(['koru', 'hafifle'])
    expect(rows.map((row) => row.id)).toEqual([1, 2])
    // History is never rewritten: the earlier row survives the second choice.
    expect(resolveDirection(rows, '2026-07-29')).toBe('koru')
    expect(pendingDirection(rows, '2026-07-29')?.direction).toBe('hafifle')
  })

  it('keeps one profile out of another profile log', async () => {
    await goalDirectionRepo.add({
      profileId: 12,
      direction: 'koru',
      effectiveFrom: '2026-06-01',
      createdAt: '2026-05-27T10:00:00.000Z',
    })
    expect(await goalDirectionRepo.forProfile(13)).toEqual([])
  })

  it('notifies the live key so a screen refreshes after a choice', async () => {
    let notified = 0
    const unsubscribe = subscribe(['goalDirections'], () => {
      notified += 1
    })
    await goalDirectionRepo.add({
      profileId: 12,
      direction: 'guclen',
      effectiveFrom: '2026-08-03',
      createdAt: '2026-07-29T18:30:00.000Z',
    })
    unsubscribe()
    expect(notified).toBe(1)
  })

  it('does not append a row that repeats the queued choice', async () => {
    const row = {
      profileId: 12,
      direction: 'hafifle' as const,
      effectiveFrom: '2026-08-03',
      createdAt: '2026-07-29T18:30:00.000Z',
    }
    await goalDirectionRepo.add(row)
    await goalDirectionRepo.add({ ...row, createdAt: '2026-07-29T18:31:00.000Z' })
    expect(await goalDirectionRepo.forProfile(12)).toHaveLength(1)
  })

  it('drops a stored row whose direction it does not recognise', async () => {
    memory.set(
      storageKey,
      JSON.stringify({
        version: 1,
        rows: [
          { id: 1, direction: 'koru', effectiveFrom: '2026-06-01', createdAt: '2026-05-27T10:00:00.000Z' },
          { id: 2, direction: 'wildcard', effectiveFrom: '2026-07-06', createdAt: '2026-07-01T10:00:00.000Z' },
        ],
      }),
    )
    const rows = await goalDirectionRepo.forProfile(12)
    expect(rows.map((row) => row.direction)).toEqual(['koru'])
  })

  it('reads unparseable storage as no history rather than failing', async () => {
    memory.set(storageKey, '{ not json')
    expect(await goalDirectionRepo.forProfile(12)).toEqual([])
  })

  it('clears every profile log on session reset', async () => {
    await goalDirectionRepo.add({
      profileId: 12,
      direction: 'koru',
      effectiveFrom: '2026-06-01',
      createdAt: '2026-05-27T10:00:00.000Z',
    })
    await clearGoalDirections()
    expect(memory.size).toBe(0)
  })
})

describe('buildDirectionRow', () => {
  it('dates the row on the coming Monday and keeps the supplied timestamp', () => {
    expect(buildDirectionRow(12, 'hafifle', '2026-07-29', '2026-07-29T18:30:00.000Z')).toEqual({
      profileId: 12,
      direction: 'hafifle',
      effectiveFrom: '2026-08-03',
      createdAt: '2026-07-29T18:30:00.000Z',
    })
  })
})
