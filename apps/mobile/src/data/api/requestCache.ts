/**
 * Read path for GET requests: in-flight deduplication, a very short in-memory
 * TTL, and a disk snapshot that survives the process.
 *
 * Why it exists (measured): the whole repository layer is network calls, and
 * `useLive` reruns its query on every notify(). One launch of the Bugün screen
 * fired `/v1/summary?date=today` FOUR times (TodayScreen + useWaterTarget +
 * NutritionCard + TodayBoard) and `/v1/measurements` and
 * `/v1/meals/logged-dates` twice each. Every meal or glass of water logged
 * restarted that storm.
 *
 * Three layers, consulted in order:
 *
 *  1. **In-flight dedup.** A second call for a path already in flight gets the
 *     SAME promise. No staleness risk at all: it is the identical response.
 *     This is what collapses Bugün's four concurrent summary reads into one.
 *
 *  2. **Short-lived memory cache (ttlMs).** Catches the near-simultaneous case
 *     a parent fetching, then children mounting a beat later.
 *
 *  3. **Disk snapshot (optional port).** Paints the last known answer instantly
 *     on a cold start and keeps the app usable offline. The network request
 *     still runs; when its answer differs from what was painted, `onRevalidated`
 *     fires so the screens can pick the fresh value up.
 *
 * Freshness after a write: a mutation invalidates the read paths it actually
 * affects (see invalidation.ts), and an unrecognised mutation invalidates
 * everything. Invalidation clears layers 1 and 2, and stops layer 3 from being
 * READ for those paths for the rest of the session. That last part matters: the
 * disk still holds the pre-write answer, and painting it after someone logged a
 * meal would show them their own meal missing. Layer 3 keeps being WRITTEN
 * throughout, so the next cold start still opens on current data.
 *
 * Lifetime: layers 1 and 2 live on the `createApiClient` instance, so they are
 * per session and reset on sign-in and sign-out. Layer 3 is account-scoped and
 * cleared by the sign-out task list.
 */

/** Last known answers that outlive the process. Implemented by snapshotStore. */
export interface SnapshotPort {
  read(key: string): unknown | undefined
  write(key: string, value: unknown): void
}

export interface RequestCacheOptions {
  /** How long a memory entry counts as fresh (ms). Default 2000. Kept short:
   *  the job is to absorb a mount wave, and writes invalidate anyway. */
  ttlMs?: number
  /** Injectable clock for tests; production uses Date.now. */
  now?: () => number
  /** Disk layer. Omitted in tests and before an account is bound. */
  snapshot?: SnapshotPort
  /** Called when a background refresh produced something other than the
   *  snapshot that was already painted. The data layer turns this into a
   *  notify() so live queries rerun and pick up the fresh value. */
  onRevalidated?: (key: string) => void
  /** Deep comparison used to decide whether a refresh actually changed
   *  anything. Defaults to reference equality when not supplied. */
  isEqual?: (a: unknown, b: unknown) => boolean
}

export interface RequestCache {
  /** Applies the three layers above to `fetcher` for a GET path. */
  dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T>
  /** Drops memory entries and in-flight results whose key starts with any of
   *  these prefixes. Used by mutations with a known blast radius. */
  invalidatePrefixes(prefixes: string[]): void
  /** Drops every memory entry and in-flight result. The fallback for mutations
   *  with no rule, and for account-level changes. */
  invalidateAll(): void
}

interface Inflight {
  p: Promise<unknown>
  /** Set when an invalidation lands while this request is still in the air.
   *  A poisoned result is returned to its caller but never cached: it was
   *  already stale when it arrived. */
  poisoned: boolean
  /** Snapshot value served to callers while this request is in the air, or
   *  undefined when there is none. Resolved once, at request start, so every
   *  caller for the same path is answered the same way. */
  painted: unknown | undefined
}

function matchesAny(key: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => key.startsWith(prefix))
}

export function createRequestCache(opts: RequestCacheOptions = {}): RequestCache {
  const ttlMs = opts.ttlMs ?? 2000
  const now = opts.now ?? Date.now
  const snapshot = opts.snapshot
  const onRevalidated = opts.onRevalidated
  const isEqual = opts.isEqual ?? ((a: unknown, b: unknown) => a === b)

  const inflight = new Map<string, Inflight>()
  const fresh = new Map<string, { at: number; value: unknown }>()

  /* Paths whose disk answer is known to predate a write made in this session.
     Never cleared: once a write has moved a path, memory and the network own it
     for the rest of the session, and the disk copy is only there for the next
     cold start. */
  const suppressedPrefixes: string[] = []
  let suppressAllSnapshots = false

  function readSnapshotFor(key: string): unknown | undefined {
    if (!snapshot || suppressAllSnapshots) return undefined
    if (matchesAny(key, suppressedPrefixes)) return undefined
    return snapshot.read(key)
  }

  function start<T>(key: string, fetcher: () => Promise<T>): Inflight {
    const record: Inflight = {
      p: undefined as unknown as Promise<unknown>,
      poisoned: false,
      painted: readSnapshotFor(key),
    }
    record.p = fetcher()
      .then((value) => {
        if (!record.poisoned) {
          fresh.set(key, { at: now(), value })
          snapshot?.write(key, value)
          if (record.painted !== undefined && !isEqual(value, record.painted)) {
            onRevalidated?.(key)
          }
        }
        return value
      })
      .finally(() => {
        // Only remove our own record; a newer request may have replaced it.
        if (inflight.get(key) === record) inflight.delete(key)
      })
    inflight.set(key, record)
    return record
  }

  return {
    dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
      const hit = fresh.get(key)
      if (hit && now() - hit.at < ttlMs) return Promise.resolve(hit.value as T)

      const record = inflight.get(key) ?? start(key, fetcher)
      if (record.painted === undefined) return record.p as Promise<T>

      /* A snapshot answers this caller, so the request behind it is a
         background refresh. Its failure must not surface (last known data beats
         an error screen when the network is gone) and must not become an
         unhandled rejection now that nobody is awaiting it. */
      void record.p.catch(() => undefined)
      return Promise.resolve(record.painted as T)
    },

    invalidatePrefixes(prefixes: string[]): void {
      if (prefixes.length === 0) return
      suppressedPrefixes.push(...prefixes)
      for (const key of [...fresh.keys()]) {
        if (matchesAny(key, prefixes)) fresh.delete(key)
      }
      for (const [key, record] of [...inflight]) {
        if (!matchesAny(key, prefixes)) continue
        record.poisoned = true
        inflight.delete(key)
      }
    },

    invalidateAll(): void {
      suppressAllSnapshots = true
      fresh.clear()
      for (const record of inflight.values()) record.poisoned = true
      inflight.clear()
    },
  }
}
