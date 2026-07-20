import { describe, expect, it } from 'vitest'
import type { ApiGroupMember, ApiGroupView } from '@/data/api/client'

import { mergeGroupMutationView } from './group-view'

function member(userId: string, energyRatio: number | null): ApiGroupMember {
  return {
    userId,
    displayName: userId,
    emoji: null,
    role: userId === 'owner' ? 'owner' : 'member',
    joinedAt: '2026-07-20T00:00:00.000Z',
    sofraVisible: true,
    energyRatio,
    afiyetToday: true,
    greetedToday: false,
  }
}

function view(
  name: string,
  members: ApiGroupMember[],
  week: ApiGroupView['week'],
): ApiGroupView {
  return {
    group: {
      id: 'group-id',
      name,
      code: 'ABC12345',
      emoji: '🍲',
      isPublic: false,
      createdAt: '2026-07-20T00:00:00.000Z',
    },
    myRole: 'owner',
    members,
    week,
  }
}

describe('mergeGroupMutationView', () => {
  it('preserves the week and member ratios missing from a mutation response', () => {
    const week = { weekStart: '2026-07-20', counts: [1, 0, 0, 0, 0, 0, 0], total: 1, goal: 10 }
    const previous = view('Old name', [member('owner', 0.8), member('friend', 0.4)], week)
    const mutation = view('New name', [member('owner', null)], null)

    expect(mergeGroupMutationView(previous, mutation)).toEqual({
      ...mutation,
      week,
      members: [member('owner', 0.8)],
    })
  })

  it('prefers fresh date-scoped values when the response includes them', () => {
    const previous = view('Group', [member('owner', 0.2)], {
      weekStart: '2026-07-13',
      counts: [1, 1, 1, 1, 1, 0, 0],
      total: 5,
      goal: 5,
    })
    const fresh = view('Group', [member('owner', 0.9)], {
      weekStart: '2026-07-20',
      counts: [1, 0, 0, 0, 0, 0, 0],
      total: 1,
      goal: 5,
    })

    expect(mergeGroupMutationView(previous, fresh)).toEqual(fresh)
  })
})
