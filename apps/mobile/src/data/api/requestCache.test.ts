import { describe, expect, it, vi } from 'vitest'
import { jsonEqual } from '../equal'
import { createRequestCache, type SnapshotPort } from './requestCache'

/** In-memory stand-in for the disk snapshot store. */
function fakeSnapshot(seed: Record<string, unknown> = {}): SnapshotPort & {
  entries: Map<string, unknown>
} {
  const entries = new Map<string, unknown>(Object.entries(seed))
  return {
    entries,
    read: (key) => entries.get(key),
    write: (key, value) => {
      entries.set(key, value)
    },
  }
}

/** Lets queued promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

describe('request cache', () => {
  it('deduplicates concurrent requests for the same key', async () => {
    const cache = createRequestCache()
    const request = deferred<number>()
    const fetcher = vi.fn(() => request.promise)

    const first = cache.dedupe('summary', fetcher)
    const second = cache.dedupe('summary', fetcher)

    expect(second).toBe(first)
    expect(fetcher).toHaveBeenCalledTimes(1)

    request.resolve(42)
    await expect(Promise.all([first, second])).resolves.toEqual([42, 42])
  })

  it('serves fresh values until the TTL expires', async () => {
    let now = 1_000
    const cache = createRequestCache({ ttlMs: 2_000, now: () => now })
    const fetcher = vi.fn(async () => fetcher.mock.calls.length)

    await expect(cache.dedupe('profile', fetcher)).resolves.toBe(1)
    now = 2_999
    await expect(cache.dedupe('profile', fetcher)).resolves.toBe(1)
    now = 3_000
    await expect(cache.dedupe('profile', fetcher)).resolves.toBe(2)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('does not cache rejected requests', async () => {
    const cache = createRequestCache()
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('recovered')

    await expect(cache.dedupe('groups', fetcher)).rejects.toThrow('offline')
    await expect(cache.dedupe('groups', fetcher)).resolves.toBe('recovered')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('invalidates fresh values immediately', async () => {
    const cache = createRequestCache()
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('old')
      .mockResolvedValueOnce('new')

    await expect(cache.dedupe('measurements', fetcher)).resolves.toBe('old')
    cache.invalidateAll()
    await expect(cache.dedupe('measurements', fetcher)).resolves.toBe('new')
  })

  it('prevents stale in-flight requests from overwriting post-invalidation data', async () => {
    const cache = createRequestCache()
    const staleRequest = deferred<string>()
    const freshRequest = deferred<string>()
    const stale = cache.dedupe('summary', () => staleRequest.promise)

    cache.invalidateAll()
    const fresh = cache.dedupe('summary', () => freshRequest.promise)

    staleRequest.resolve('stale')
    await expect(stale).resolves.toBe('stale')
    freshRequest.resolve('fresh')
    await expect(fresh).resolves.toBe('fresh')

    const replacement = vi.fn(async () => 'replacement')
    await expect(cache.dedupe('summary', replacement)).resolves.toBe('fresh')
    expect(replacement).not.toHaveBeenCalled()
  })
})

describe('targeted invalidation', () => {
  it('drops only the reads a write actually touched', async () => {
    const cache = createRequestCache()
    const water = vi.fn<() => Promise<string>>().mockResolvedValue('water')
    const sofras = vi.fn<() => Promise<string>>().mockResolvedValue('sofras')

    await cache.dedupe('/v1/water?date=x', water)
    await cache.dedupe('/v1/sofras', sofras)

    cache.invalidatePrefixes(['/v1/water', '/v1/summary'])

    await cache.dedupe('/v1/water?date=x', water)
    await cache.dedupe('/v1/sofras', sofras)

    expect(water).toHaveBeenCalledTimes(2)
    expect(sofras).toHaveBeenCalledTimes(1)
  })

  it('poisons only the in-flight requests it matched', async () => {
    const cache = createRequestCache()
    const summary = deferred<string>()
    const sofras = deferred<string>()

    const summaryCall = cache.dedupe('/v1/summary?date=x', () => summary.promise)
    const sofrasCall = cache.dedupe('/v1/sofras', () => sofras.promise)

    cache.invalidatePrefixes(['/v1/summary'])
    summary.resolve('stale summary')
    sofras.resolve('sofras')
    await Promise.all([summaryCall, sofrasCall])

    // The poisoned one refetches; the untouched one is served from cache.
    const summaryAgain = vi.fn(async () => 'fresh summary')
    const sofrasAgain = vi.fn(async () => 'other sofras')
    await expect(cache.dedupe('/v1/summary?date=x', summaryAgain)).resolves.toBe('fresh summary')
    await expect(cache.dedupe('/v1/sofras', sofrasAgain)).resolves.toBe('sofras')
    expect(sofrasAgain).not.toHaveBeenCalled()
  })

  it('does nothing when a write declares it changes no reads', async () => {
    const cache = createRequestCache()
    const fetcher = vi.fn<() => Promise<string>>().mockResolvedValue('profile')

    await cache.dedupe('/v1/profile', fetcher)
    cache.invalidatePrefixes([])
    await cache.dedupe('/v1/profile', fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})

describe('persistent snapshot layer', () => {
  it('paints the stored answer immediately and still asks the network', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary': { streak: 3 } })
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })
    const fetcher = vi.fn(async () => ({ streak: 4 }))

    await expect(cache.dedupe('/v1/summary', fetcher)).resolves.toEqual({ streak: 3 })
    expect(fetcher).toHaveBeenCalledTimes(1)

    await settle()
    expect(snapshot.entries.get('/v1/summary')).toEqual({ streak: 4 })
  })

  it('announces a refresh that changed something', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary': { streak: 3 } })
    const onRevalidated = vi.fn()
    const cache = createRequestCache({ snapshot, onRevalidated, isEqual: jsonEqual })

    await cache.dedupe('/v1/summary', async () => ({ streak: 4 }))
    await settle()

    expect(onRevalidated).toHaveBeenCalledWith('/v1/summary')
  })

  it('stays silent when the refresh confirms what was already painted', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary': { streak: 3 } })
    const onRevalidated = vi.fn()
    const cache = createRequestCache({ snapshot, onRevalidated, isEqual: jsonEqual })

    await cache.dedupe('/v1/summary', async () => ({ streak: 3 }))
    await settle()

    expect(onRevalidated).not.toHaveBeenCalled()
  })

  it('keeps serving the snapshot when the network is gone', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary': { streak: 3 } })
    const onRevalidated = vi.fn()
    const cache = createRequestCache({ snapshot, onRevalidated, isEqual: jsonEqual })

    await expect(
      cache.dedupe('/v1/summary', async () => {
        throw new Error('offline')
      }),
    ).resolves.toEqual({ streak: 3 })

    await settle()
    expect(onRevalidated).not.toHaveBeenCalled()
    // The stored answer survives a failed refresh rather than being cleared.
    expect(snapshot.entries.get('/v1/summary')).toEqual({ streak: 3 })
  })

  it('surfaces the failure when there is no snapshot to fall back on', async () => {
    const cache = createRequestCache({ snapshot: fakeSnapshot(), isEqual: jsonEqual })

    await expect(
      cache.dedupe('/v1/summary', async () => {
        throw new Error('offline')
      }),
    ).rejects.toThrow('offline')
  })

  it('does not write a result that a mutation invalidated mid-flight', async () => {
    const snapshot = fakeSnapshot()
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })
    const request = deferred<{ streak: number }>()

    const call = cache.dedupe('/v1/summary', () => request.promise)
    cache.invalidatePrefixes(['/v1/summary'])
    request.resolve({ streak: 4 })
    await call
    await settle()

    expect(snapshot.entries.has('/v1/summary')).toBe(false)
  })

  it('answers every caller for a path the same way while one request is in flight', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary': { streak: 3 } })
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })
    const request = deferred<{ streak: number }>()
    const fetcher = vi.fn(() => request.promise)

    /* Two components mounting together used to disagree: the first was painted
       from disk while the second joined the in-flight request and waited. */
    const first = cache.dedupe('/v1/summary', fetcher)
    const second = cache.dedupe('/v1/summary', fetcher)

    await expect(first).resolves.toEqual({ streak: 3 })
    await expect(second).resolves.toEqual({ streak: 3 })
    expect(fetcher).toHaveBeenCalledTimes(1)

    request.resolve({ streak: 4 })
    await settle()
  })

  it('stops painting a path from disk once a write has moved it', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary?date=x': { meals: 0 } })
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })

    // A meal is logged, so the stored answer now predates the user's own write.
    cache.invalidatePrefixes(['/v1/summary'])

    const request = deferred<{ meals: number }>()
    const call = cache.dedupe('/v1/summary?date=x', () => request.promise)
    request.resolve({ meals: 1 })

    // The server's answer, not the disk copy showing the meal missing.
    await expect(call).resolves.toEqual({ meals: 1 })
  })

  it('keeps painting the paths a write did not touch', async () => {
    const snapshot = fakeSnapshot({
      '/v1/summary?date=x': { meals: 0 },
      '/v1/sofras': [{ name: 'kahvaltı' }],
    })
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })

    cache.invalidatePrefixes(['/v1/summary'])

    await expect(cache.dedupe('/v1/sofras', async () => [])).resolves.toEqual([
      { name: 'kahvaltı' },
    ])
  })

  it('keeps writing to disk after a write, so the next launch opens on current data', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary?date=x': { meals: 0 } })
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })

    cache.invalidatePrefixes(['/v1/summary'])
    await cache.dedupe('/v1/summary?date=x', async () => ({ meals: 1 }))
    await settle()

    expect(snapshot.entries.get('/v1/summary?date=x')).toEqual({ meals: 1 })
  })

  it('stops painting everything once an unmapped write invalidated all', async () => {
    const snapshot = fakeSnapshot({ '/v1/sofras': [{ name: 'kahvaltı' }] })
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })

    cache.invalidateAll()

    await expect(cache.dedupe('/v1/sofras', async () => [])).resolves.toEqual([])
  })

  it('prefers a fresher memory entry over the painted snapshot', async () => {
    const snapshot = fakeSnapshot({ '/v1/summary': { streak: 3 } })
    const cache = createRequestCache({ snapshot, isEqual: jsonEqual })

    await cache.dedupe('/v1/summary', async () => ({ streak: 4 }))
    await settle()

    const unused = vi.fn(async () => ({ streak: 9 }))
    await expect(cache.dedupe('/v1/summary', unused)).resolves.toEqual({ streak: 4 })
    expect(unused).not.toHaveBeenCalled()
  })
})
