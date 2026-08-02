/**
 * Disk-backed snapshot of GET responses, so a cold start paints real data
 * instead of a skeleton and the app keeps working offline.
 *
 * Why this exists: the repository layer is entirely network (there is no local
 * copy), so every launch used to refetch everything before anything could be
 * drawn. The Bugün screen alone mounts around nine distinct GETs. The in-memory
 * request cache collapses that mount wave, but it dies with the process.
 *
 * What this is NOT: a source of truth. A snapshot only ever paints first; the
 * network request always still runs and its answer wins. That is why
 * invalidation (see requestCache) deliberately does not touch this layer: after
 * a mutation the snapshot is merely the last thing the server actually said,
 * which beats an empty screen when the follow-up refresh cannot reach the
 * network. Successful GETs overwrite it; sign-out clears it.
 *
 * Shape: one AsyncStorage blob per account rather than one key per path. The
 * whole set is capped small, so hydration is a single read and a flush is a
 * single debounced write. Account scoping follows the ftueFlags convention:
 * snapshots must never cross an account boundary.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'fh:snap:account:'

/** Entries older than this are ignored on read and dropped on hydration.
 *  A week-old league tier or quest set is more misleading than a skeleton. */
export const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Caps. LRU eviction keeps the blob small enough to read and write cheaply. */
const MAX_ENTRIES = 64
const MAX_ENTRY_BYTES = 64 * 1024
const MAX_TOTAL_BYTES = 512 * 1024

/** Writes are batched: a mount wave produces one flush, not nine. */
const FLUSH_DEBOUNCE_MS = 1_000

/** Paths that must never reach the disk. Search and discovery results are
 *  worthless a launch later, and assistant traffic has no business being
 *  mirrored to storage. Matched as prefixes. */
const DENY_PREFIXES = [
  '/v1/users/search',
  '/v1/groups/discover',
  '/v1/afi/',
  '/v1/ask/',
  '/v1/events',
]

interface Entry {
  /** Epoch millis the value was stored at. */
  at: number
  value: unknown
  /** Serialized size, tracked so the total cap does not restringify everything. */
  bytes: number
}

export interface SnapshotStoreOptions {
  /** Injectable clock for tests; production uses Date.now. */
  now?: () => number
}

let now: () => number = Date.now
let activeAccountId: string | null = null

/** Insertion order doubles as LRU order: a write deletes then re-sets its key. */
let entries = new Map<string, Entry>()
let totalBytes = 0

/** Bumped by every hydrate and clear. A flush or hydration whose generation is
 *  stale must not write, or a sign-out could be undone by an in-flight task. */
let generation = 0
let flushTimer: ReturnType<typeof setTimeout> | null = null
let pendingFlush: Promise<void> | null = null
/** Serializes storage access the way ftueFlags does, so a hydrate and a flush
 *  never interleave on the same key. */
let storageQueue: Promise<void> = Promise.resolve()

function storageKey(accountId: string): string {
  return PREFIX + encodeURIComponent(accountId)
}

function enqueueStorage<T>(operation: () => Promise<T>): Promise<T> {
  const run = storageQueue.catch(() => undefined).then(operation)
  storageQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function isDenied(key: string): boolean {
  return DENY_PREFIXES.some((prefix) => key.startsWith(prefix))
}

function evictWhileOverCap(): void {
  while (entries.size > MAX_ENTRIES || totalBytes > MAX_TOTAL_BYTES) {
    const oldest = entries.keys().next()
    if (oldest.done) break
    const entry = entries.get(oldest.value)
    entries.delete(oldest.value)
    totalBytes -= entry?.bytes ?? 0
  }
}

/** Test seam; production never calls this. */
export function configureSnapshotStore(options: SnapshotStoreOptions): void {
  now = options.now ?? Date.now
}

/**
 * Loads one account's snapshots into memory. Called wherever FTUE account flags
 * are loaded, so the mirror is warm before the first screen queries.
 *
 * Failures are swallowed: an unreadable blob means a cold start that behaves
 * exactly like today's, which is a worse experience but never a wrong one.
 */
export async function hydrateSnapshots(accountId: string): Promise<void> {
  const mine = ++generation
  activeAccountId = accountId
  entries = new Map()
  totalBytes = 0

  try {
    const raw = await enqueueStorage(() => AsyncStorage.getItem(storageKey(accountId)))
    if (mine !== generation) return
    if (!raw) return

    const parsed = JSON.parse(raw) as Record<string, Entry> | null
    if (!parsed || typeof parsed !== 'object') return

    const cutoff = now() - SNAPSHOT_MAX_AGE_MS
    /* Oldest first, so insertion order stays a usable LRU approximation across
       launches rather than whatever order the JSON happened to serialize in. */
    const usable = Object.entries(parsed)
      .filter(([key, entry]) => entry && typeof entry.at === 'number' && entry.at > cutoff && !isDenied(key))
      .sort(([, a], [, b]) => a.at - b.at)

    for (const [key, entry] of usable) {
      const bytes = typeof entry.bytes === 'number' ? entry.bytes : 0
      entries.set(key, { at: entry.at, value: entry.value, bytes })
      totalBytes += bytes
    }
    evictWhileOverCap()
  } catch {
    // A corrupt blob starts the account with an empty mirror, never another account's.
    if (mine === generation) {
      entries = new Map()
      totalBytes = 0
    }
  }
}

/**
 * Last known server answer for a path, or undefined when there is none, it is
 * older than the staleness ceiling, or no account is bound. Synchronous by
 * design: the request cache consults it on the hot path and cannot await.
 */
export function readSnapshot(key: string): unknown | undefined {
  if (!activeAccountId) return undefined
  const entry = entries.get(key)
  if (!entry) return undefined
  if (now() - entry.at > SNAPSHOT_MAX_AGE_MS) {
    entries.delete(key)
    totalBytes -= entry.bytes
    return undefined
  }
  return entry.value
}

/** Records a successful GET. Fire and forget; the flush is debounced. */
export function writeSnapshot(key: string, value: unknown): void {
  if (!activeAccountId || isDenied(key)) return

  let serialized: string
  try {
    serialized = JSON.stringify(value)
  } catch {
    return // Unserializable answers simply do not get a snapshot.
  }
  if (serialized === undefined) return
  const bytes = serialized.length
  if (bytes > MAX_ENTRY_BYTES) return

  const previous = entries.get(key)
  if (previous) totalBytes -= previous.bytes
  entries.delete(key) // Re-set below so this key moves to the LRU tail.
  entries.set(key, { at: now(), value, bytes })
  totalBytes += bytes
  evictWhileOverCap()
  scheduleFlush()
}

function scheduleFlush(): void {
  if (flushTimer !== null) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    pendingFlush = flushSnapshots()
  }, FLUSH_DEBOUNCE_MS)
}

/** Writes the mirror to disk. Exported so tests (and shutdown paths) can await it. */
export async function flushSnapshots(): Promise<void> {
  const mine = generation
  const accountId = activeAccountId
  if (!accountId) return

  const payload: Record<string, Entry> = {}
  for (const [key, entry] of entries) payload[key] = entry

  try {
    await enqueueStorage(async () => {
      // Re-checked inside the queue: a sign-out may have landed while waiting.
      if (mine !== generation || activeAccountId !== accountId) return
      await AsyncStorage.setItem(storageKey(accountId), JSON.stringify(payload))
    })
  } catch {
    // A failed flush costs a cold start, not correctness.
  }
}

/** Awaits any flush that is already scheduled or running. Test helper. */
export async function settleSnapshots(): Promise<void> {
  if (flushTimer !== null) {
    clearTimeout(flushTimer)
    flushTimer = null
    pendingFlush = flushSnapshots()
  }
  await pendingFlush
  await storageQueue
}

/**
 * Drops the account's snapshots from memory and disk. Registered as a
 * sign-out task: without this the next account could be painted with the
 * previous one's summary.
 */
export async function clearSnapshots(): Promise<void> {
  const accountId = activeAccountId
  generation += 1
  activeAccountId = null
  entries = new Map()
  totalBytes = 0
  if (flushTimer !== null) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  pendingFlush = null
  if (!accountId) return
  await enqueueStorage(() => AsyncStorage.removeItem(storageKey(accountId)))
}
