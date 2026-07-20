import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('account deletion error', () => {
  it('shows calm Turkish copy without exposing the server error', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/app/hesap.tsx', import.meta.url),
      'utf8',
    )
    const deletionHandler = source.slice(
      source.indexOf('const doDelete'),
      source.indexOf('const confirmDelete'),
    )

    expect(deletionHandler).toContain("Alert.alert(\n        'Hesabını silemedik'")
    expect(deletionHandler).toContain(
      'Şu anda işlemi tamamlayamadık. Biraz sonra tekrar deneyebilirsin.',
    )
    expect(deletionHandler).not.toContain('e.message')
  })
})
