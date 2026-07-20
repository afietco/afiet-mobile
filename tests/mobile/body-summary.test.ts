import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const screenPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/(tabs)/vucudum.tsx', import.meta.url),
)

describe('body summary rendering', () => {
  it('gates missing summaries and renders metrics only from a present body summary', async () => {
    const source = await readFile(screenPath, 'utf8')

    expect(source).toMatch(/summary == null/)
    expect(source).toMatch(/\{bodySummary \? \(/)
    expect(source).toContain('Veri hazırlanıyor')
    expect(source).not.toMatch(/(?:tdeeVal|bmrVal|bmiVal|profile\.sex)!/)
  })
})
