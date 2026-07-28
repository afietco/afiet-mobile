import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const screenPath = fileURLToPath(
  new URL('../../apps/mobile/src/app/(tabs)/vucudum.tsx', import.meta.url),
)

describe('body summary rendering', () => {
  // The daily energy and BMI card moved behind the Hedeflerim screen, so the
  // tab reads the body summary only for the fat-percent series. The gate and
  // the optional access still have to hold: a summary can arrive with no body
  // block at all.
  it('gates missing summaries and reads the body block only through optional access', async () => {
    const source = await readFile(screenPath, 'utf8')

    expect(source).toMatch(/summary == null/)
    expect(source).toMatch(/bodySummary\?\./)
    expect(source).not.toMatch(/bodySummary\./)
    expect(source).not.toMatch(/(?:tdeeVal|bmrVal|bmiVal|profile\.sex)!/)
  })
})
