import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFile(new URL(`../../apps/mobile/src/${path}`, import.meta.url), 'utf8')

describe('group actions refresh what the server recomputes', () => {
  it('keeps groups in the live key union even without a local table', async () => {
    // The server derives quests, level and league from group membership and
    // greetings, so those actions need a key to invalidate on.
    const source = await read('data/live.ts')

    expect(source).toMatch(/export type TableName =[\s\S]*'groups'/)
  })

  it('notifies on every membership change', async () => {
    const source = await read('features/groups/useGroups.ts')

    expect(source).toContain("import { notify } from '@/data/live'")
    for (const action of ['createGroup', 'joinGroup', 'leaveGroup', 'deleteGroup', 'removeMember']) {
      const start = source.indexOf(`async function ${action}(`)
      expect(start, `${action} is missing`).toBeGreaterThan(-1)
      const end = source.indexOf('\nasync function ', start + 1)
      const body = source.slice(start, end === -1 ? undefined : end)
      expect(body, `${action} does not notify`).toContain("notify('groups')")
    }
  })

  it('notifies after a greeting, which has a quest of its own', async () => {
    const source = await read('features/groups/greetings.ts')

    expect(source).toContain("import { notify } from '@/data/live'")
    expect(source).toMatch(/sendGreeting\(groupId, toUserId, date\)\s*\n\s*\/\/[^\n]*\n\s*notify\('groups'\)/)
  })

  it('rebuilds the quest list and the level ring when a group changes', async () => {
    const quests = await read('features/progress/quests.ts')
    const progress = await read('features/progress/useProgress.ts')

    expect(quests).toMatch(/QUEST_TABLES = \[[\s\S]*'groups'/)
    expect(progress).toMatch(/PROGRESS_TABLES = \[[^\]]*'groups'/)
  })

  it('does not notify for edits that change nothing the server recomputes', async () => {
    // Renaming a group or flipping table visibility earns no quest; the store
    // already re-renders its own consumers.
    const source = await read('features/groups/useGroups.ts')
    const start = source.indexOf('async function updateGroup(')
    const end = source.indexOf('\nasync function ', start + 1)

    expect(source.slice(start, end === -1 ? undefined : end)).not.toContain("notify('groups')")
  })
})
