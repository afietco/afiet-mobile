import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resetIdMap, toNum, toUuid } from '../../apps/mobile/src/data/api/idMap'
import { runSessionResetTasks } from '../../apps/mobile/src/features/auth/sessionReset'

const authContextPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/auth/AuthContext.tsx', import.meta.url),
)

describe('session reset', () => {
  it('runs every task and reports isolated failures', async () => {
    const calls: string[] = []
    const failures = await runSessionResetTasks([
      {
        name: 'successful sync reset',
        reset: () => {
          calls.push('sync')
        },
      },
      {
        name: 'failed reset',
        reset: () => {
          calls.push('failed')
          throw new Error('storage unavailable')
        },
      },
      {
        name: 'successful async reset',
        reset: async () => {
          await Promise.resolve()
          calls.push('async')
        },
      },
    ])

    expect(calls.sort()).toEqual(['async', 'failed', 'sync'])
    expect(failures).toHaveLength(1)
    expect(failures[0].name).toBe('failed reset')
    expect(String(failures[0].reason)).toMatch(/storage unavailable/)
  })

  it('removes identifier mappings and restarts local numbering', () => {
    resetIdMap()
    const first = toNum('first-user-record')
    const second = toNum('second-user-record')

    expect(first).toBe(1)
    expect(second).toBe(2)
    expect(toUuid(first)).toBe('first-user-record')

    resetIdMap()

    expect(toUuid(first)).toBeUndefined()
    expect(toNum('new-session-record')).toBe(1)
  })

  it('resets every user-scoped store before becoming anonymous', async () => {
    const source = await readFile(authContextPath, 'utf8')
    const requiredResetters = [
      'clearTokens',
      'clearNotifications',
      'resetSocialStore',
      'resetGroupsStore',
      'resetFtueFlags',
      'clearPendingEmailChange',
      'resetIdMap',
      'resetWidgetState',
    ]

    for (const resetter of requiredResetters) {
      expect(source).toMatch(new RegExp(`reset: ${resetter}\\b`))
    }
    expect(source).toContain('reset: () => clearIdentityDraft(endingUserId)')

    expect(
      source.match(
        /await clearLocalSession\(endingUserId\)\s+setSessionEndReason\('expired'\)\s+setStatus\('anon'\)/g,
      ),
    ).toHaveLength(1)
    expect(
      source.match(
        /await clearLocalSession\(endingUserId\)\s+setSessionEndReason\(null\)\s+setStatus\('anon'\)/g,
      ),
    ).toHaveLength(1)
  })
})
