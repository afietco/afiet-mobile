import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const storage = {
  getItem: vi.fn().mockResolvedValue(null),
  setItem: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  multiRemove: vi.fn().mockResolvedValue(undefined),
}

const mockPlatform = () => {
  vi.doMock('@react-native-async-storage/async-storage', () => ({ default: storage }))
  let uuid = 0
  vi.doMock('expo-crypto', () => ({ randomUUID: () => `test-sid-${++uuid}` }))
}

describe('core loop telemetry', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    storage.getItem.mockResolvedValue(null)
    storage.setItem.mockResolvedValue(undefined)
    storage.removeItem.mockResolvedValue(undefined)
    storage.multiRemove.mockResolvedValue(undefined)
  })

  it('flushes queued events enriched with sid and timestamp', async () => {
    const sendEvents = vi.fn().mockResolvedValue(undefined)
    mockPlatform()
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')

    track('water_logged', { glasses: 2 })
    await flushTelemetry()

    expect(sendEvents).toHaveBeenCalledWith([
      {
        name: 'water_logged',
        props: expect.objectContaining({
          glasses: 2,
          sid: expect.any(String),
          ts: expect.any(Number),
        }),
      },
    ])
  })

  it('keeps events across a failed flush and delivers them on the next one', async () => {
    const sendEvents = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
    mockPlatform()
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')

    track('measurement_added')
    await flushTelemetry()
    await flushTelemetry()

    expect(sendEvents).toHaveBeenCalledTimes(2)
    expect(sendEvents.mock.calls[1][0]).toEqual(sendEvents.mock.calls[0][0])
    // The disk copy is refreshed before every send so a kill cannot lose the batch.
    expect(storage.setItem).toHaveBeenCalled()
  })

  it('splits oversized queues into server-sized batches of 100', async () => {
    const sendEvents = vi.fn().mockResolvedValue(undefined)
    mockPlatform()
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')

    for (let i = 0; i < 150; i++) track('screen_view', { screen: 'bugun', i })
    await flushTelemetry()

    expect(sendEvents).toHaveBeenCalledTimes(2)
    expect(sendEvents.mock.calls[0][0]).toHaveLength(100)
    expect(sendEvents.mock.calls[1][0]).toHaveLength(50)
  })

  it('lets lifecycle code override sid and ts for retroactive events', async () => {
    const sendEvents = vi.fn().mockResolvedValue(undefined)
    mockPlatform()
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')

    track('session_end', { sid: 'previous-run-sid', ts: 12345, duration_sec: 60 })
    await flushTelemetry()

    expect(sendEvents.mock.calls[0][0][0].props).toMatchObject({
      sid: 'previous-run-sid',
      ts: 12345,
      duration_sec: 60,
    })
  })

  it('caps the queue at 500 events, dropping the oldest first', async () => {
    const sendEvents = vi.fn().mockRejectedValue(new Error('offline'))
    mockPlatform()
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')

    for (let i = 0; i < 520; i++) track('screen_view', { i })
    await flushTelemetry()

    // First delivery attempt sees a full-but-capped queue whose oldest
    // surviving event is number 20 (0..19 were dropped).
    expect(sendEvents.mock.calls[0][0]).toHaveLength(100)
    expect(sendEvents.mock.calls[0][0][0].props).toMatchObject({ i: 20 })
  })

  it('drops a batch the server rejects instead of poisoning future flushes', async () => {
    const { ApiError } = await import('../../apps/mobile/src/data/api/client')
    const sendEvents = vi.fn().mockRejectedValue(new ApiError(400, 'bad batch'))
    mockPlatform()
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')

    track('measurement_added')
    await flushTelemetry()
    await flushTelemetry()

    expect(sendEvents).toHaveBeenCalledTimes(1)
  })

  it('delivers every event exactly once when the cap shifts a queue mid-flight', async () => {
    mockPlatform()
    let trackRef: ((name: never, props?: Record<string, unknown>) => void) | null = null
    const delivered: Record<string, unknown>[] = []
    const sendEvents = vi.fn().mockImplementation(async (batch: { props: Record<string, unknown> }[]) => {
      delivered.push(...batch.map((e) => e.props))
      // While the first batch is "in flight", a new event arrives at cap and
      // shifts the array under the flush loop.
      if (sendEvents.mock.calls.length === 1) trackRef?.('screen_view' as never, { fresh: true })
    })
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track } = await import('../../apps/mobile/src/lib/track')
    trackRef = track as never

    for (let i = 0; i < 500; i++) track('screen_view', { i })
    await flushTelemetry()
    await flushTelemetry()

    expect(delivered).toHaveLength(501)
    expect(delivered.filter((p) => p.fresh)).toHaveLength(1)
    const seen = new Set(delivered.filter((p) => typeof p.i === 'number').map((p) => p.i))
    expect(seen.size).toBe(500)
  })

  it('clears the queue and both storage keys on sign-out reset', async () => {
    const sendEvents = vi.fn().mockResolvedValue(undefined)
    mockPlatform()
    vi.doMock('../../apps/mobile/src/data/api/apiHolder', () => ({
      requireApi: () => ({ sendEvents }),
    }))
    const { flushTelemetry, track, resetTelemetry } = await import('../../apps/mobile/src/lib/track')
    const { currentSid } = await import('../../apps/mobile/src/lib/telemetrySession')

    const sidBefore = currentSid()
    track('water_logged', { glasses: 1 })
    await resetTelemetry()
    await flushTelemetry()

    expect(sendEvents).not.toHaveBeenCalled()
    expect(storage.multiRemove).toHaveBeenCalledWith([
      'afiet.telemetry.queue',
      'afiet.telemetry.session',
    ])
    expect(currentSid()).not.toBe(sidBefore)
  })

  it('expires a stale notification-launch mark instead of labeling a later session', async () => {
    mockPlatform()
    vi.setSystemTime(new Date('2026-07-31T12:00:00Z'))
    const session = await import('../../apps/mobile/src/lib/telemetrySession')

    session.markLaunchFromNotification()
    vi.setSystemTime(new Date('2026-07-31T12:01:00Z'))
    expect(session.consumeLaunchFromNotification()).toBe(false)

    session.markLaunchFromNotification()
    vi.setSystemTime(new Date('2026-07-31T12:01:05Z'))
    expect(session.consumeLaunchFromNotification()).toBe(true)
    // An open counts once.
    expect(session.consumeLaunchFromNotification()).toBe(false)
  })

  it('keeps telemetry teardown inside the sign-out contract', () => {
    const reset = source('../../apps/mobile/src/features/auth/localSessionReset.ts')
    expect(reset).toContain("{ name: 'behavior telemetry', reset: resetTelemetry }")
  })

  it('flushes on AppState background transitions', () => {
    const lifecycle = source('../../apps/mobile/src/lib/useTelemetryFlush.ts')
    const rootLayout = source('../../apps/mobile/src/app/_layout.tsx')

    expect(lifecycle).toContain("AppState.addEventListener('change'")
    expect(lifecycle).toContain("if (state !== 'active') void flushTelemetry()")
    expect(rootLayout).toContain('useTelemetryFlush()')
  })

  it('mounts session tracking and emits the session vocabulary', () => {
    const rootLayout = source('../../apps/mobile/src/app/_layout.tsx')
    const session = source('../../apps/mobile/src/lib/useSessionTracking.ts')
    const sheet = source('../../apps/mobile/src/ui/Sheet.tsx')

    expect(rootLayout).toContain('<SessionTrackingHost />')
    expect(session).toContain("track('session_start'")
    expect(session).toContain("track('session_end'")
    expect(session).toContain("track('screen_view'")
    expect(sheet).toContain("track('sheet_view'")
    expect(sheet).toContain("track('sheet_closed'")
  })

  it('tracks successful meal, water, measurement, and onboarding actions', () => {
    const actionSources = [
      '../../apps/mobile/src/features/nutrition/AddFoodSheet.tsx',
      '../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx',
      '../../apps/mobile/src/features/onboarding/pendingFirstMeal.ts',
      '../../apps/mobile/src/features/home/TodayBoard.tsx',
      '../../apps/mobile/src/features/body/MeasurementSheet.tsx',
      '../../apps/mobile/src/app/onboarding.tsx',
    ].map(source).join('\n')

    expect(actionSources).toContain("track('meal_logged'")
    expect(actionSources).toContain("track('water_logged'")
    expect(actionSources).toContain("track('measurement_added'")
    expect(actionSources).toContain("track('onboarding_completed'")
  })
})
