import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { resetIdMap, toNum, toUuid } from '../src/data/api/idMap.ts'
import { runSessionResetTasks } from '../src/features/auth/sessionReset.ts'

const authContextPath = fileURLToPath(
  new URL('../src/features/auth/AuthContext.tsx', import.meta.url),
)

test('session reset runs every task and reports isolated failures', async () => {
  const calls = []
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

  assert.deepEqual(calls.sort(), ['async', 'failed', 'sync'])
  assert.equal(failures.length, 1)
  assert.equal(failures[0].name, 'failed reset')
  assert.match(String(failures[0].reason), /storage unavailable/)
})

test('identifier reset removes both mappings and restarts local numbering', () => {
  resetIdMap()
  const first = toNum('first-user-record')
  const second = toNum('second-user-record')

  assert.equal(first, 1)
  assert.equal(second, 2)
  assert.equal(toUuid(first), 'first-user-record')

  resetIdMap()

  assert.equal(toUuid(first), undefined)
  assert.equal(toNum('new-session-record'), 1)
})

test('AuthContext resets every user-scoped store before becoming anonymous', async () => {
  const source = await readFile(authContextPath, 'utf8')
  const requiredResetters = [
    'clearTokens',
    'clearNotifications',
    'resetSocialStore',
    'resetGroupsStore',
    'resetFtueFlags',
    'resetIdMap',
    'resetWidgetState',
  ]

  for (const resetter of requiredResetters) {
    assert.match(source, new RegExp(`reset: ${resetter}\\b`))
  }

  const orderedTransitions = source.match(
    /await clearLocalSession\(\)\s+setStatus\('anon'\)/g,
  )
  assert.equal(orderedTransitions?.length, 2)
})
