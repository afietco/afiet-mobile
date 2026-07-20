import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const screenPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/aliskanliklarim.tsx', import.meta.url),
)

describe('habit rhythm card', () => {
  it('uses a seven-day logging rhythm without streak reset language', async () => {
    const source = await readFile(screenPath, 'utf8')

    expect(source).toContain('const daysLogged7 = loggedDates7.size')
    expect(source).toContain('Haftalık ritmin')
    expect(source).toContain('aradaki boş günler önceki kayıtlarını silmez')
    expect(source).not.toContain('IconFlame')
    expect(source).not.toContain('summary?.streak')
    expect(source).not.toContain('gün seri')
  })
})
