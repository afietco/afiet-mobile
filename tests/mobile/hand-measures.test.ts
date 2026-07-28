import { readdir, readFile } from 'node:fs/promises'
import { GOAL_ESTIMATE_NOTE, HAND_TERMS } from '@afiet/core'
import { describe, expect, it } from 'vitest'

/**
 * The third piece of the dissolved Hedeflerim screen: "Günün ölçüsü".
 *
 * The screen that used to host it is gone and the measures moved to Beslenme,
 * so these promises (docs/hedeflerim.md, sections 5 and 12) are guarded at the
 * component and at whoever renders it, rather than at a fixed screen path. The
 * meter and the numbers are guarded in vucudum-goals-layer.test.ts; the
 * direction question in direction-sheet.test.ts.
 */

const SRC = new URL('../../apps/mobile/src/', import.meta.url)
const HANDS = 'features/goals/HandMeasures.tsx'

function read(path: string): Promise<string> {
  return readFile(new URL(path, SRC), 'utf8')
}

/** Every source file under apps/mobile/src, as paths relative to it. */
async function sourceFiles(): Promise<string[]> {
  const found: string[] = []
  const walk = async (dir: URL, prefix: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const next = `${prefix}${entry.name}`
      if (entry.isDirectory()) await walk(new URL(`${entry.name}/`, dir), `${next}/`)
      else if (next.endsWith('.ts') || next.endsWith('.tsx')) found.push(next)
    }
  }
  await walk(SRC, '')
  return found
}

describe('hand measures', () => {
  it('uses the blog vocabulary exactly', () => {
    expect(Object.values(HAND_TERMS)).toEqual(['avuç içi', 'yumruk', 'kapalı avuç', 'başparmak'])
  })

  it('prints the engine text and never builds a decimal of its own', async () => {
    const source = await read(HANDS)
    expect(source).toContain('{measure.text}')
    expect(source).not.toContain('toFixed')
    expect(source).not.toMatch(/çukur avuç/)
  })

  it('carries the honesty anchor as the engine words it', async () => {
    expect(GOAL_ESTIMATE_NOTE).toBe(
      'Bu ölçüler şimdilik tahmin. Kayıt biriktikçe sana göre düzelteceğim.',
    )
    /* The line arrives as a prop rather than being written here, so on the day
       calibration replaces the estimate the sentence changes with it instead of
       lingering as a claim that is no longer true. */
    const source = await read(HANDS)
    expect(source).toContain('{note}')
    expect(source).not.toContain('şimdilik tahmin')
  })

  it('is handed that anchor by whoever renders it', async () => {
    const files = await sourceFiles()
    const hosts: string[] = []
    for (const path of files) {
      if (path === HANDS) continue
      const source = await read(path)
      if (source.includes('<HandMeasures')) hosts.push(path)
    }
    expect(hosts.length).toBeGreaterThan(0)
    for (const path of hosts) {
      const source = await read(path)
      expect(source, path).toMatch(/note=\{[^}]*confidenceNote\}/)
    }
  })
})
