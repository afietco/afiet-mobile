import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const discoveryPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/groups/PublicGroupsDiscover.tsx', import.meta.url),
)

describe('public group join consent', () => {
  it('explains shared data before starting the join mutation', async () => {
    const source = await readFile(discoveryPath, 'utf8')

    expect(source).toContain('onPress={confirmJoin}')
    expect(source).toContain('grup üyeleri enerji halkanı ve afiyet günlerini görebilir')
    expect(source).toContain('Öğün detayların ve kilon paylaşılmaz')
    expect(source).toContain("{ text: 'Vazgeç', style: 'cancel' }")
    expect(source).toContain("{ text: 'Katıl', onPress: () => void joinConfirmed() }")
    expect(source).toMatch(/const joinConfirmed[\s\S]*joinPublicGroup\(group\.id\)/)
  })
})
