import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const guidePath = fileURLToPath(
  new URL('../../apps/mobile/src/features/ftue/today-afi-guide.tsx', import.meta.url),
)

describe('Afi guide query gate', () => {
  it('does not mount live queries after the guide is completed', async () => {
    const source = await readFile(guidePath, 'utf8')
    const outerComponent = source.indexOf('export function TodayAfiGuide')
    const completionFlag = source.indexOf('useAfiGuideCompleted()', outerComponent)
    const completionGate = source.indexOf('if (completed) return null', completionFlag)
    const dataComponentMount = source.indexOf('<ActiveTodayAfiGuide {...props} />', completionGate)
    const dataComponent = source.indexOf('function ActiveTodayAfiGuide', dataComponentMount)
    const waterQuery = source.indexOf('waterRepo.forRange', dataComponent)

    expect(completionFlag).toBeGreaterThan(outerComponent)
    expect(completionGate).toBeGreaterThan(completionFlag)
    expect(dataComponentMount).toBeGreaterThan(completionGate)
    expect(dataComponent).toBeGreaterThan(dataComponentMount)
    expect(waterQuery).toBeGreaterThan(dataComponent)
  })
})
