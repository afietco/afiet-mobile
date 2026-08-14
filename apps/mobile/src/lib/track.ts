import AsyncStorage from '@react-native-async-storage/async-storage'
import { requireApi } from '../data/api/apiHolder'
import { ApiError } from '../data/api/client'
import { currentSid, rotateSid, TELEMETRY_SESSION_STORAGE_KEY } from './telemetrySession'

/**
 * Behavior telemetry; see docs/feature-list/event-altyapisi.md.
 *
 * Every event is enriched with the session id (`sid`) and a client timestamp
 * (`ts`, epoch millis) so the admin panel can rebuild session timelines even
 * when delivery happens long after the moment. Events queue in memory, persist
 * to AsyncStorage, and are sent in batches. The queue survives restarts so
 * offline stretches and app kills do not punch holes into a session, but
 * telemetry still never blocks the experience: failures re-queue silently and
 * the queue is capped, dropping the oldest events first.
 *
 * Duplicate delivery is possible in one narrow window (batch sent, process
 * killed before the persisted queue is rewritten); analytics reads tolerate it.
 * Event properties must not contain PII.
 */

export const TELEMETRY_EVENTS = [
  'session_start',
  'session_end',
  /* How long a launch took, from the first line of JS to the splash coming
     down, with the two flags that explain an unusual number (fonts loaded at
     runtime, session not settled in time). Emitted once per process. */
  'cold_start',
  'screen_view',
  'sheet_view',
  'sheet_closed',
  'ui_tap',
  'meal_logged',
  'water_logged',
  'onboarding_completed',
  'measurement_added',
  'balance_viewed',
  'afiyet_day_completed',
  'move_offered',
  'move_done',
  'move_dismissed',
  'week_summary_opened',
  'rhythm_week_completed',
  'nudge_shown',
  'nudge_acted',
  'reaction_sent',
  'pause_started',
  'pause_ended',
  'afi_celebration_shown',
  'afi_assist_used',
  'afi_suggestion_accepted',
  'afi_suggestion_rejected',
  'afi_guide_started',
  'afi_guide_step_shown',
  'afi_guide_completed',
  'afi_guide_ended',
  'group_public_on',
  'group_public_off',
  'sofra_visibility_on',
  'sofra_visibility_off',
  // Chat: props carry the assistant id and durations ONLY. Message content
  // never enters telemetry; the transcript exists solely on the device.
  'chat_opened',
  'chat_message_sent',
  'chat_reply_completed',
  'chat_destek_intro_accepted',
  /* Which kind of attachment, never the file itself and never its contents. */
  'chat_attachment_sent',
  /* How conversations are kept: started and deleted, never their titles. */
  'chat_session_started',
  'chat_session_deleted',
  /* We asked the store for a review. It is not "a prompt was shown" and it is
     certainly not "a review was left": the store never tells us either
     (features/review/storeReview.ts). */
  'review_prompt_requested',
] as const

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number]

interface QueuedEvent {
  name: TelemetryEventName
  props: Record<string, unknown>
}

const QUEUE_KEY = 'afiet.telemetry.queue'
/** Oldest events are dropped past this point; bounds pre-login backlogs too. */
const QUEUE_CAP = 500
/** Server-side limit on POST /v1/events; larger queues flush in several calls. */
const BATCH_MAX = 100
const FLUSH_DELAY_MS = 3000
const PERSIST_DELAY_MS = 1000

const queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let persistTimer: ReturnType<typeof setTimeout> | null = null
let flushing = false

// Events persisted by a previous run are older than anything tracked since
// module load, so they go to the front of the queue once read.
const hydration = AsyncStorage.getItem(QUEUE_KEY)
  .then((raw) => {
    if (!raw) return
    const parsed = JSON.parse(raw) as QueuedEvent[]
    if (Array.isArray(parsed)) queue.unshift(...parsed)
    while (queue.length > QUEUE_CAP) queue.shift()
  })
  .catch(() => {
    // A corrupt or unreadable record only costs the backlog itself.
  })

async function persistNow(): Promise<void> {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = null
  // Never write before the stored backlog has been merged in: a pre-hydration
  // snapshot would overwrite the previous run's events with only the fresh ones.
  await hydration
  try {
    if (queue.length === 0) await AsyncStorage.removeItem(QUEUE_KEY)
    else await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch {
    // Losing a persist attempt only risks losing the backlog on a kill.
  }
}

/** Removes an already-handled batch by identity: while a send was in flight,
    the cap may have shifted the array, so positional splicing could remove an
    event that was never sent. */
function removeFromQueue(batch: QueuedEvent[]): void {
  const handled = new Set(batch)
  const kept = queue.filter((event) => !handled.has(event))
  queue.length = 0
  queue.push(...kept)
}

function schedulePersist(): void {
  persistTimer ??= setTimeout(() => void persistNow(), PERSIST_DELAY_MS)
}

/** Forces the queue to disk right now. Called on backgrounding: timers freeze
    there, so the debounced persist cannot be trusted and an in-flight flush
    may never reach its own persist before a kill. */
export async function persistTelemetryQueue(): Promise<void> {
  await persistNow()
}

export async function flushTelemetry(): Promise<void> {
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = null
  await hydration
  if (flushing) return
  flushing = true
  // Make sure the disk copy holds everything about to go over the wire, so a
  // kill during the request cannot lose the batch.
  await persistNow()
  try {
    while (queue.length > 0) {
      const batch = queue.slice(0, BATCH_MAX)
      try {
        await requireApi().sendEvents(batch)
        removeFromQueue(batch)
      } catch (error) {
        if (error instanceof ApiError && (error.status === 400 || error.status === 413)) {
          // The server rejected the payload itself; keeping it would poison
          // every future flush. Other 4xx (408/429 from intermediaries, 401)
          // are transient and the events stay.
          removeFromQueue(batch)
          continue
        }
        // Offline, timeout, auth not ready: keep the events for a later flush.
        break
      }
    }
  } finally {
    flushing = false
    void persistNow()
  }
}

/**
 * Sign-out teardown (see features/auth/localSessionReset.ts): the queue and
 * the session heartbeat are account-scoped in effect: anything left behind
 * would be delivered under, or stitched into, the NEXT account's sessions.
 * The sid also rotates so the signed-out journey gets its own session.
 */
export async function resetTelemetry(): Promise<void> {
  await hydration
  queue.length = 0
  if (flushTimer) clearTimeout(flushTimer)
  flushTimer = null
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = null
  rotateSid()
  await AsyncStorage.multiRemove([QUEUE_KEY, TELEMETRY_SESSION_STORAGE_KEY])
}

export function track(name: TelemetryEventName, props?: Record<string, unknown>): void {
  // Explicit sid/ts win, so lifecycle code can write events into a previous
  // session retroactively (e.g. the session_end of a killed run).
  queue.push({ name, props: { sid: currentSid(), ts: Date.now(), ...props } })
  while (queue.length > QUEUE_CAP) queue.shift()
  schedulePersist()
  flushTimer ??= setTimeout(() => void flushTelemetry(), FLUSH_DELAY_MS)
}

/**
 * Semantic tap on a named target; prefer this over ad-hoc event names.
 *
 * The target and every property must be a fixed key or a counter. Names,
 * addresses, free text and food names are the exact things this must never
 * carry: `ui_tap` is the widest event in the dictionary, so it is also the
 * easiest one to turn into a log of what somebody ate.
 */
export function trackTap(target: string, props?: Record<string, unknown>): void {
  track('ui_tap', { target, ...props })
}

/** Fixed salt so an id cannot be recovered by hashing the id space alone. */
const ID_HASH_SALT = 'afiet.telemetry.v1'

function fnv1a(input: string, seed: number): number {
  let h = seed
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Stable pseudonym for an identifier that must not travel raw.
 *
 * The dictionary asks for `group_id_hash`, never `group_id`: a cohort read
 * needs to tell two groups apart, it never needs to look one up. Two FNV-1a
 * lanes give 64 bits, which is wide enough that groups do not collide, and the
 * result is the same on every device, which is what makes one group's
 * greetings add up across its members.
 */
export function hashId(value: string): string {
  const salted = `${ID_HASH_SALT}:${value}`
  return fnv1a(salted, 0x811c9dc5).toString(36) + fnv1a(salted, 0x9dc5811c).toString(36)
}
