import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('core loop telemetry', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
  })

  it('flushes queued events immediately when requested', async () => {
    const sendEvents = vi.fn().mockResolvedValue(undefined)
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')

    track('water_logged', { glasses: 2 })
    await flushTelemetry()

    expect(sendEvents).toHaveBeenCalledWith([
      { name: 'water_logged', props: { glasses: 2 } },
    ])
  })

  it('flushes on AppState background transitions', () => {
    const lifecycle = source('../../apps/mobile/src/lib/useTelemetryFlush.ts')
    const rootLayout = source('../../apps/mobile/src/app/_layout.tsx')

    expect(lifecycle).toContain("AppState.addEventListener('change'")
    expect(lifecycle).toContain("if (state !== 'active') void flushTelemetry()")
    expect(rootLayout).toContain('useTelemetryFlush()')
  })

  it('tracks successful meal, water, measurement, and onboarding actions', () => {
    const actionSources = [
      '../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx',
      '../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx',
      '../../apps/mobile/src/features/onboarding/pendingFirstMeal.ts',
      '../../apps/mobile/src/features/home/WaterMiniCard.tsx',
      '../../apps/mobile/src/features/ftue/StarterTasksCard.tsx',
      '../../apps/mobile/src/features/body/MeasurementSheet.tsx',
      '../../apps/mobile/src/app/onboarding.tsx',
    ].map(source).join('\n')

    expect(actionSources).toContain("track('meal_logged'")
    expect(actionSources).toContain("track('water_logged'")
    expect(actionSources).toContain("track('measurement_added'")
    expect(actionSources).toContain("track('onboarding_completed'")
  })
})
