import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const starterTasksPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/ftue/StarterTasksCard.tsx', import.meta.url),
)

describe('starter tasks query gate', () => {
  it('does not mount live queries after the tasks are dismissed', async () => {
    const source = await readFile(starterTasksPath, 'utf8')
    const outerComponent = source.indexOf('export function StarterTasksCard')
    const completionFlag = source.indexOf("useFtueSeen('starterDone')", outerComponent)
    const completionGate = source.indexOf('if (done) return null', completionFlag)
    const dataComponentMount = source.indexOf('<StarterTasksContent {...props} />', completionGate)
    const dataComponent = source.indexOf('function StarterTasksContent', dataComponentMount)
    const waterQuery = source.indexOf('waterRepo.forRange', dataComponent)

    expect(completionFlag).toBeGreaterThan(outerComponent)
    expect(completionGate).toBeGreaterThan(completionFlag)
    expect(dataComponentMount).toBeGreaterThan(completionGate)
    expect(dataComponent).toBeGreaterThan(dataComponentMount)
    expect(waterQuery).toBeGreaterThan(dataComponent)
  })
})
