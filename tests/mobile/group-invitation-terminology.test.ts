import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const groupUiFiles = [
  '../../apps/mobile/src/features/groups/CreateGroupSheet.tsx',
  '../../apps/mobile/src/features/groups/JoinGroupSheet.tsx',
  '../../apps/mobile/src/features/groups/GroupHome.tsx',
  '../../apps/mobile/src/features/groups/GroupEditSheet.tsx',
  '../../apps/mobile/src/app/katil/[code].tsx',
]

describe('group invitation terminology', () => {
  it('calls the eight-character value an invitation code everywhere', async () => {
    const sources = await Promise.all(
      groupUiFiles.map((path) => readFile(new URL(path, import.meta.url), 'utf8')),
    )
    const copy = sources.join('\n')

    expect(copy).toContain('Davet koduyla katıl')
    expect(copy).toContain('Davet kodu: ${code}')
    expect(copy).toContain('8 karakterli davet kodunu')
    expect(copy).not.toMatch(/grup ID|Grup ID|ID ile katıl|grup kodu|Davet linki/)
  })
})
