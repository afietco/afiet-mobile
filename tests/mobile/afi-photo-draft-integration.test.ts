import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Afi photo draft lifecycle', () => {
  it('restores and persists the active queue and conversation', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain('loadAfiPhotoDraft(scope)')
    expect(source).toContain('saveAfiPhotoDraft(scope, {')
    expect(source).toContain('messages: messages.map')
    expect(source).toContain('queue,')
    expect(source).toContain('conversationId: conversationId.current')
  })

  it('clears the persisted conversation during session reset', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/features/auth/AuthContext.tsx', import.meta.url),
      'utf8',
    )

    expect(source).toContain("{ name: 'Afi photo draft', reset: clearAfiPhotoDraft }")
  })
})
