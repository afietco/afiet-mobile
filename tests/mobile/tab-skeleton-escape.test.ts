import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const tabs = ['index', 'beslenme', 'vucudum', 'grubum'] as const
const tabUrl = (name: string) =>
  new URL(`../../apps/mobile/src/app/(tabs)/${name}.tsx`, import.meta.url)
const skeletonUrl = new URL('../../apps/mobile/src/ui/PageSkeleton.tsx', import.meta.url)

describe('tab loading states always have a way out', () => {
  it('arms the timeout only when a retry exists, so a bare skeleton never expires', async () => {
    // This is why a skeleton without onRetry can hang forever: the contract the
    // screens below have to satisfy.
    const source = await readFile(skeletonUrl, 'utf8')

    expect(source).toContain('const canRetry = onRetry != null')
    expect(source).toContain('if (hasError || !canRetry) return')
    expect(source).toContain('setTimeout(() => setTimedOut(true), timeoutMs)')
  })

  it('never renders a full page skeleton a tab cannot recover from', async () => {
    // A tab screen stays mounted once visited, so a stuck skeleton is not
    // cleared by switching tabs: it reads as a blank page that never leaves.
    for (const tab of tabs) {
      const source = await readFile(tabUrl(tab), 'utf8')
      const bare = source.match(/<PageSkeleton\s*\/>/g) ?? []

      expect(bare, `${tab} renders a PageSkeleton with no retry`).toEqual([])
    }
  })

  it('lets the tab gate recover from a profile load that never settles', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/app/(tabs)/_layout.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('if (loading) return <PageSkeleton onRetry={retry} />')
  })

  it('lets the nutrition tab surface a failed summary instead of swallowing it', async () => {
    const source = await readFile(tabUrl('beslenme'), 'utf8')

    // useSummary drops the error; useSummaryResult keeps it.
    expect(source).toContain('useSummaryResult')
    expect(source).not.toMatch(/\buseSummary\(/)
    expect(source).toContain('error={summaryQuery.error}')
    expect(source).toContain('onRetry={summaryQuery.retry}')
  })

  it('lets the group tab retry a first load that never settles', async () => {
    const source = await readFile(tabUrl('grubum'), 'utf8')

    expect(source).toContain("state.status === 'loading'")
    expect(source).toContain('onRetry={() => void reload()}')
  })
})
