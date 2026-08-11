import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

/** Every .ts/.tsx file under a directory, so a guard can read the whole app. */
function sourceFiles(root: URL): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) walk(path)
      else if (/\.tsx?$/.test(entry.name)) out.push(path)
    }
  }
  walk(fileURLToPath(root))
  return out
}

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

  /**
   * `ui_tap` used to be called in exactly one file, so "En sık dokunuşlar" in
   * the admin panel could only ever answer "people tap the login buttons".
   * These targets are the product's own funnels; each one is asserted where it
   * lives, because a tap moved off its surface stops meaning what it says.
   */
  it('names a tap target on every funnel step the panel reads', () => {
    const taps: [string, string][] = [
      // Add-food: which of the four doors, then which route out of the search.
      [
        '../../apps/mobile/src/features/nutrition/MealBoard.tsx',
        "trackTap('add_food_open', { from: 'meal_board' })",
      ],
      [
        '../../apps/mobile/src/features/home/NutritionCard.tsx',
        "trackTap('add_food_open', { from: 'today_card' })",
      ],
      [
        '../../apps/mobile/src/features/home/NutritionCard.tsx',
        "trackTap('add_food_open', { from: 'today_first' })",
      ],
      [
        '../../apps/mobile/src/features/nutrition/MealDetailSheet.tsx',
        "trackTap('add_food_open', { from: 'meal_detail' })",
      ],
      [
        '../../apps/mobile/src/features/nutrition/addfood/FoodSearchStep.tsx',
        "trackTap('addfood_search_pick')",
      ],
      [
        '../../apps/mobile/src/features/nutrition/addfood/FoodSearchStep.tsx',
        "trackTap('addfood_photo')",
      ],
      [
        '../../apps/mobile/src/features/nutrition/addfood/FoodSearchStep.tsx',
        "trackTap('addfood_sentence')",
      ],
      [
        '../../apps/mobile/src/features/nutrition/addfood/FoodDetailsStep.tsx',
        "trackTap('addfood_save', { again: andAnother })",
      ],
      [
        '../../apps/mobile/src/features/nutrition/addfood/FoodDetailsStep.tsx',
        "trackTap('addfood_skip_item')",
      ],
      // Afi's photo tour, counted at the intent rather than at the picture.
      [
        '../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx',
        "trackTap('afi_photo_shot', { source: 'camera' })",
      ],
      [
        '../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx',
        "trackTap('afi_photo_shot', { source: 'library' })",
      ],
      [
        '../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx',
        "trackTap('afi_photo_correction')",
      ],
      // Group funnel: offered, submitted, and the two ways an invite travels.
      ['../../apps/mobile/src/app/(tabs)/grubum.tsx', "trackTap('group_create_open')"],
      ['../../apps/mobile/src/app/(tabs)/grubum.tsx', "trackTap('group_join_open')"],
      [
        '../../apps/mobile/src/features/groups/CreateGroupSheet.tsx',
        "trackTap('group_create_submit')",
      ],
      [
        '../../apps/mobile/src/features/groups/JoinGroupSheet.tsx',
        "trackTap('group_join_submit', { via: 'code' })",
      ],
      [
        '../../apps/mobile/src/features/groups/PublicGroupsDiscover.tsx',
        "trackTap('group_join_submit', { via: 'public' })",
      ],
      [
        '../../apps/mobile/src/features/groups/GroupHome.tsx',
        "trackTap('group_invite_share', { from: 'code' })",
      ],
      [
        '../../apps/mobile/src/features/groups/GroupHome.tsx',
        "trackTap('group_invite_share', { from: 'icon' })",
      ],
      ['../../apps/mobile/src/features/social/AddFriendSheet.tsx', "trackTap('friend_code_share')"],
      // Gamification and the chat doorways.
      ['../../apps/mobile/src/features/nav/AppHeader.tsx', "trackTap('kese_chip')"],
      [
        '../../apps/mobile/src/features/home/TodayBoard.tsx',
        "trackTap('lig_open', { from: 'today' })",
      ],
      [
        '../../apps/mobile/src/features/progress/ProgressCard.tsx',
        "trackTap('lig_open', { from: 'progress' })",
      ],
      [
        '../../apps/mobile/src/app/lig/index.tsx',
        "trackTap('lig_open', { from: 'standings' })",
      ],
      ['../../apps/mobile/src/app/gorevlerim.tsx', "trackTap('quest_claim', { from: 'list' })"],
      [
        '../../apps/mobile/src/features/progress/QuestDetailSheet.tsx',
        "trackTap('quest_claim', { from: 'sheet' })",
      ],
      [
        '../../apps/mobile/src/features/chat/entryCards.tsx',
        "trackTap('chat_entry', { from: 'nutrition_card', assistant: 'beslenme' })",
      ],
      [
        '../../apps/mobile/src/features/chat/entryCards.tsx',
        "trackTap('chat_entry', { from: 'body_card', assistant: 'destek' })",
      ],
      [
        '../../apps/mobile/src/features/chat/entryCards.tsx',
        "trackTap('chat_entry', { from: 'body_row', assistant: 'destek' })",
      ],
      [
        '../../apps/mobile/src/app/yapay-zeka.tsx',
        "trackTap('chat_entry', { from: 'ai_hub', assistant: agent.id })",
      ],
      [
        '../../apps/mobile/src/features/home/TodayBoard.tsx',
        "trackTap('chat_entry', { from: 'today', assistant: 'afi' })",
      ],
      ['../../apps/mobile/src/features/nav/LiquidTabBar.tsx', "trackTap('tab_switch', { tab: route.name })"],
    ]

    const missing = taps.filter(([path, call]) => !source(path).includes(call))
    expect(missing).toEqual([])
  })

  it('only counts a tab switch that actually moved', () => {
    const bar = source('../../apps/mobile/src/features/nav/LiquidTabBar.tsx')
    // Re-tapping the current tab, and a press a screen swallowed, are not
    // movement; the target sits inside the guard that decides that.
    const guard = bar.indexOf('if (!focused && !event.defaultPrevented)')
    const tap = bar.indexOf("trackTap('tab_switch'")
    expect(guard).toBeGreaterThan(-1)
    expect(tap).toBeGreaterThan(guard)
  })

  it('sends the greeting as reaction_sent with a hashed group', () => {
    const home = source('../../apps/mobile/src/features/groups/GroupHome.tsx')
    expect(home).toContain("track('reaction_sent', { group_id_hash: hashId(groupId) })")
    // The raw id never leaves as a property of its own.
    expect(home).not.toContain('group_id: groupId')
  })

  it('pseudonymises an identifier instead of carrying it', async () => {
    mockPlatform()
    const { hashId } = await import('../../apps/mobile/src/lib/track')
    const groupId = '5f1c9b6e-3d47-4a1a-8f2c-2b7e6f0a1c33'
    const hash = hashId(groupId)

    expect(hash).not.toContain(groupId)
    // Same everywhere, so one group's greetings add up across its members.
    expect(hashId(groupId)).toBe(hash)
    expect(hashId('5f1c9b6e-3d47-4a1a-8f2c-2b7e6f0a1c34')).not.toBe(hash)
  })

  /**
   * The guard that keeps `ui_tap` from becoming a diary. It is the widest event
   * in the dictionary, so a single `{ food: name }` added in a hurry would ship
   * meals to the server under a name nobody reads as PII.
   */
  it('lets no free text into a tap property', () => {
    /* Non-literal values that have been read and are known to be closed sets:
       an auth mode, an assistant id, a route name, a boolean flag. */
    const vetted = new Set(['mode', 'agent.id', 'route.name', 'andAnother'])
    const offenders: string[] = []

    for (const file of sourceFiles(new URL('../../apps/mobile/src', import.meta.url))) {
      for (const raw of readFileSync(file, 'utf8').split('\n')) {
        const call = /trackTap\((.*)\)\s*$/.exec(raw.trim())
        if (!call) continue
        const args = call[1] ?? ''
        const [target, ...rest] = args.split(/,(.+)/)
        if (!/^'[a-z0-9_]+'$/.test((target ?? '').trim())) {
          offenders.push(raw.trim())
          continue
        }
        const props = rest.join('').trim().replace(/^\{|\}$/g, '')
        for (const entry of props.split(',')) {
          const text = entry.trim()
          if (!text) continue
          // `key: value` carries its value on the right; a bare word is React
          // shorthand and is itself the value.
          const value = (text.includes(':') ? text.slice(text.indexOf(':') + 1) : text).trim()
          const literal = /^'[a-z0-9_]+'$/.test(value) || value === 'true' || value === 'false'
          if (!literal && !vetted.has(value)) offenders.push(raw.trim())
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
