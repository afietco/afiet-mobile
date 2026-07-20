import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const celebrationPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/ftue/FirstLogCelebration.tsx', import.meta.url),
)

describe('first log celebration language', () => {
  it('celebrates an afiyet day and week without score or streak language', async () => {
    const source = await readFile(celebrationPath, 'utf8')

    expect(source).toContain('IconBowl')
    expect(source).toContain('İlk afiyet günün, bu hafta 1/5')
    expect(source).toContain('afiyet haftanı')
    expect(source).not.toContain('IconFlame')
    expect(source).not.toMatch(/skor|seri/i)
  })
})
