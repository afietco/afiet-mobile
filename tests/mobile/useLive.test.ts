import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { executeLiveQuery } from '../../apps/mobile/src/data/liveQuery'

const screenPaths = [
  '../../apps/mobile/src/app/(tabs)/index.tsx',
  '../../apps/mobile/src/app/(tabs)/vucudum.tsx',
  '../../apps/mobile/src/app/menum.tsx',
  '../../apps/mobile/src/app/gecmis.tsx',
  '../../apps/mobile/src/app/veri.tsx',
  '../../apps/mobile/src/app/bilgilerim.tsx',
]

describe('live query recovery', () => {
  it('resolves successful data', async () => {
    await expect(executeLiveQuery(async () => ({ value: 42 }))).resolves.toEqual({
      ok: true,
      data: { value: 42 },
    })
  })

  it('captures rejected promises without rejecting itself', async () => {
    const outcome = await executeLiveQuery(async () => {
      throw new Error('network unavailable')
    })

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.error.message).toMatch(/network unavailable/)
  })

  it('normalizes non-Error failures', async () => {
    const outcome = await executeLiveQuery(async () => Promise.reject('offline'))

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) expect(outcome.error.message).toBe('Live query failed')
  })

  it('connects affected screens to PageSkeleton error and retry states', async () => {
    for (const relativePath of screenPaths) {
      const path = fileURLToPath(new URL(relativePath, import.meta.url))
      const source = await readFile(path, 'utf8')
      expect(source).toMatch(/<PageSkeleton error=\{[^}]+\} onRetry=\{[^}]+\}/)
    }
  })

  it('exposes timeout, retry, and back navigation in PageSkeleton', async () => {
    const path = fileURLToPath(
      new URL('../../apps/mobile/src/ui/PageSkeleton.tsx', import.meta.url),
    )
    const source = await readFile(path, 'utf8')

    expect(source).toMatch(/setTimeout\(\(\) => setTimedOut\(true\), timeoutMs\)/)
    expect(source).toMatch(/Bağlantı kurulamadı/)
    expect(source).toMatch(/Tekrar dene/)
    expect(source).toMatch(/router\.back\(\)/)
  })
})
