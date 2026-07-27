import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { executeLiveQuery } from '../../apps/mobile/src/data/liveQuery'

const screenPaths = [
  '../../apps/mobile/src/app/(tabs)/index.tsx',
  '../../apps/mobile/src/app/(tabs)/vucudum.tsx',
  '../../apps/mobile/src/app/menum.tsx',
  '../../apps/mobile/src/features/insights/history-section.tsx',
  '../../apps/mobile/src/features/insights/overview-section.tsx',
]

const numbersPanelPath = '../../apps/mobile/src/features/body/NumbersPanel.tsx'
const veriScreenPath = '../../apps/mobile/src/app/veri.tsx'

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

  // The data screen is now pure chrome around NumbersPanel, which the
  // Hedeflerim screen embeds as well. The panel owns the measurements query, so
  // it also owns the error and retry surface; a page-level skeleton would be
  // chrome an embedded host cannot use.
  it('keeps the measurements query and its error and retry surface inside NumbersPanel', async () => {
    const source = await readFile(fileURLToPath(new URL(numbersPanelPath, import.meta.url)), 'utf8')

    expect(source).toMatch(/useLive\(\s*\['measurements'\]/)
    expect(source).toMatch(/<PanelFallback[\s\S]{0,200}?error=\{[^}]+\}[\s\S]{0,40}?onRetry=\{[^}]+\}/)
    expect(source).toMatch(/Tekrar dene/)
  })

  it('leaves the /veri route without a subscription of its own', async () => {
    const source = await readFile(fileURLToPath(new URL(veriScreenPath, import.meta.url)), 'utf8')

    // A second subscriber here would run the same query twice for one screen.
    expect(source).toContain('<NumbersPanel />')
    expect(source).not.toMatch(/useLive|useLiveValue|useActiveProfile|useSummaryResult/)
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
