import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { executeLiveQuery } from '../src/data/liveQuery.ts'

const screenPaths = [
  '../src/app/(tabs)/index.tsx',
  '../src/app/menum.tsx',
  '../src/app/gecmis.tsx',
  '../src/app/veri.tsx',
  '../src/app/bilgilerim.tsx',
]

test('live query resolves successful data', async () => {
  const outcome = await executeLiveQuery(async () => ({ value: 42 }))

  assert.deepEqual(outcome, { ok: true, data: { value: 42 } })
})

test('live query captures rejected promises without rejecting itself', async () => {
  const outcome = await executeLiveQuery(async () => {
    throw new Error('network unavailable')
  })

  assert.equal(outcome.ok, false)
  if (!outcome.ok) assert.match(outcome.error.message, /network unavailable/)
})

test('live query normalizes non-Error failures', async () => {
  const outcome = await executeLiveQuery(async () => Promise.reject('offline'))

  assert.equal(outcome.ok, false)
  if (!outcome.ok) assert.equal(outcome.error.message, 'Live query failed')
})

test('affected screens connect PageSkeleton error and retry states', async () => {
  for (const relativePath of screenPaths) {
    const path = fileURLToPath(new URL(relativePath, import.meta.url))
    const source = await readFile(path, 'utf8')
    assert.match(source, /<PageSkeleton error=\{[^}]+\} onRetry=\{[^}]+\}/)
  }
})

test('PageSkeleton exposes timeout, retry, and back navigation', async () => {
  const path = fileURLToPath(new URL('../src/ui/PageSkeleton.tsx', import.meta.url))
  const source = await readFile(path, 'utf8')

  assert.match(source, /setTimeout\(\(\) => setTimedOut\(true\), timeoutMs\)/)
  assert.match(source, /Bağlantı kurulamadı/)
  assert.match(source, /Tekrar dene/)
  assert.match(source, /router\.back\(\)/)
})
