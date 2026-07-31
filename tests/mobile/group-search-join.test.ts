import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const source = (relativePath: string) => readFile(new URL(relativePath, import.meta.url), 'utf8')

const SCREEN = '../../apps/mobile/src/app/(tabs)/grubum.tsx'
const DISCOVER = '../../apps/mobile/src/features/groups/PublicGroupsDiscover.tsx'

/**
 * Joining a public group from search left the sheet open over the group it had
 * just put you in, with the row still spinning: the join had worked, the
 * screen behind had already changed, and every visible sign said it had not.
 *
 * The cause was an assumption that stopped being true when discovery moved
 * inside a sheet. Inline on the empty group screen, a join replaced the whole
 * section, so nothing had to close and nothing had to settle. In a sheet,
 * neither is free.
 */
describe('joining a public group from search', () => {
  it('closes the search sheet as well as reloading', async () => {
    const screen = await source(SCREEN)

    // Both halves in the one handler: reloading alone was the bug.
    expect(screen).toMatch(/onJoined=\{\(\) => \{[\s\S]*?setSearchOpen\(false\)[\s\S]*?reload\(\)/)
  })

  /**
   * The row settles itself rather than waiting to be unmounted. What it shows
   * after a successful write must not depend on what its parent decides to do
   * with the news, or a parent that does nothing leaves a spinner forever.
   */
  it('leaves the row in a settled state of its own', async () => {
    const discover = await source(DISCOVER)

    expect(discover).toContain("setStatus('joined')")
    expect(discover).toContain('Katıldın')
    // Settled before the parent is told, so the order cannot be got wrong.
    expect(discover).toMatch(/setStatus\('joined'\)\s*\n\s*onJoined\?\.\(view\)/)
  })

  it('still returns the row to idle when the join fails', async () => {
    const discover = await source(DISCOVER)

    expect(discover).toMatch(/catch \(e\) \{\s*\n\s*setStatus\('idle'\)/)
  })
})
