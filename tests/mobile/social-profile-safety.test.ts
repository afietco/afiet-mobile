import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('public social profile safety', () => {
  it('uses group identity, not a group name, to decide what it may show', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/social/PublicProfileCard.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('myGroupId === profile.groupId')
    expect(source).not.toContain('myGroupName === profile.groupName')
  })

  it('closes the sheet when navigation changes, from the one place that does', async () => {
    const [card, sheet] = await Promise.all([
      readFile(
        new URL('../../apps/mobile/src/features/social/PublicProfileCard.tsx', import.meta.url),
        'utf8',
      ),
      readFile(new URL('../../apps/mobile/src/ui/Sheet.tsx', import.meta.url), 'utf8'),
    ])

    /* This host wrote the guard first, because it was the only sheet mounted
       above the app. Every sheet is now, so every sheet needs it and Sheet does
       it for all of them; a second copy here would only be a second thing to
       keep in step. */
    expect(card).not.toContain('usePathname')
    expect(sheet).toContain('const pathname = usePathname()')
    expect(sheet).toMatch(/previousPathname\.current !== pathname/)
  })

  it('preserves unavailable energy as null and renders a neutral avatar', async () => {
    const storeSource = await readFile(
      new URL('../../apps/mobile/src/features/social/store.ts', import.meta.url),
      'utf8',
    )
    const ringSource = await readFile(
      new URL('../../apps/mobile/src/features/groups/MemberRing.tsx', import.meta.url),
      'utf8',
    )

    expect(storeSource).toContain('energyRatio: p.energyRatio ?? null')
    expect(storeSource).toContain('groupId: p.groupId ?? null')
    expect(ringSource).toContain('ratio: number | null')
    expect(ringSource).toContain('{hasEnergy ? (')
  })
})
