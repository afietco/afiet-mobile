import { describe, expect, it } from 'vitest'
import type { ApiGroupSummary } from '@/data/api/client'
import { resolveGroupInvite } from './groupInvite'

const currentGroup: ApiGroupSummary = {
  id: 'group-1',
  name: 'Pazar Sofrası',
  code: 'ABC12345',
  emoji: '🍲',
  myRole: 'owner',
  memberCount: 3,
  createdAt: '2026-07-20T10:00:00.000Z',
}

describe('group invitation resolution', () => {
  it('recognizes the current group before attempting to join', () => {
    expect(resolveGroupInvite([currentGroup], ' abc12345 ')).toEqual({
      status: 'current',
      group: currentGroup,
    })
  })

  it('normalizes a different invitation code for the join request', () => {
    expect(resolveGroupInvite([currentGroup], ' def67890 ')).toEqual({
      status: 'join',
      code: 'DEF67890',
    })
  })
})
