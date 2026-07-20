import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const groupEditSheetPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/groups/GroupEditSheet.tsx', import.meta.url),
)

describe('group owner exit', () => {
  it('offers ownership transfer when other members remain', async () => {
    const source = await readFile(groupEditSheetPath, 'utf8')

    expect(source).toContain("onPress={() => leaveOrDelete(alone ? 'delete' : 'leave')}")
    expect(source).toContain("{alone ? 'Grubu sil' : 'Kuruculuğu devredip ayrıl'}")
    expect(source).toContain('Kuruculuk gruptaki en eski üyeye devredilecek')
    expect(source).toContain('.leaveGroup(groupId, myUserId)')
    expect(source).not.toContain('disabled={!alone}')
  })
})
