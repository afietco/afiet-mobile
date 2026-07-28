import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const boardUrl = new URL('../../apps/mobile/src/features/home/TodayBoard.tsx', import.meta.url)

describe('rows that answer to their own state', () => {
  it('turns the whole quest row green once something is ready to collect', async () => {
    const source = await readFile(boardUrl, 'utf8')

    /* The chip alone was too quiet for the one thing on this board that is
       waiting to be picked up, so the surface carries it too. */
    expect(source).toContain('highlighted={ready > 0}')
    expect(source).toMatch(/highlighted \? 'bg-emerald-50/)
  })

  it('leaves the row plain while nothing is waiting', async () => {
    const source = await readFile(boardUrl, 'utf8')
    /* The highlight has to be conditional, or it stops meaning anything. */
    expect(source).not.toMatch(/highlighted\s*$/m)
    expect(source).not.toContain('highlighted={true}')
  })

  it('names the group door for someone who has no group', async () => {
    const source = await readFile(boardUrl, 'utf8')
    // "Grubum" promises something they do not have; the door says what it does.
    expect(source).toContain("label={myGroup ? 'Grubum' : 'Gruba katıl'}")
  })
})
