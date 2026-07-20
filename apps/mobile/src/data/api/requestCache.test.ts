import { describe, expect, it, vi } from 'vitest'
import { createRequestCache } from './requestCache'

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
