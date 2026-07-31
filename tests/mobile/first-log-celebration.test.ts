import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const celebrationPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/ftue/FirstLogCelebration.tsx', import.meta.url),
)

describe('first log celebration language', () => {
  it('celebrates an afiyet day without score or streak language', async () => {
    const source = await readFile(celebrationPath, 'utf8')

    expect(source).toContain('IconBowl')
    expect(source).toContain('ilk kaydını yaptın')
    expect(source).toContain('İlk afiyet günün')
    expect(source).not.toContain('IconFlame')
    expect(source).not.toMatch(/skor|seri/i)
  })

  /**
   * The scene fires on the first log EVER, so a weekly fraction there named a
   * target of five before the person had finished their first day: one done
   * read as four still owed. The milestone is what is being celebrated.
   */
  it('does not open with a weekly quota', async () => {
    const source = await readFile(celebrationPath, 'utf8')

    expect(source).not.toMatch(/badge="Bu hafta \d+\/\d+/)
  })
})
