import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('public social profile safety', () => {
  it('uses group identity and closes the sheet when navigation changes', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/social/PublicProfileCard.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('myGroupId === profile.groupId')
    expect(source).not.toContain('myGroupName === profile.groupName')
    expect(source).toContain('const pathname = usePathname()')
    expect(source).toContain('if (previousPathname.current !== pathname) closePublicProfile()')
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
