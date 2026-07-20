import { afterEach, describe, expect, it, vi } from 'vitest'
import { executeLiveQuery } from '../liveQuery'
import { ApiRequestTimeoutError, createApiClient, type ApiMeal } from './client'

afterEach(() => {
  vi.useRealTimers()
})

const meal: ApiMeal = {
  id: '4f7e9eb4-2ed4-4b79-b633-bca7255e104a',
  entryDate: '2026-07-19',
  meal: 'ogle',
  foodName: 'Mercimek çorbası',
  quantity: 1,
  measure: 'kase',
  groups: ['bakliyat'],
  note: null,
  createdAt: '2026-07-19T12:00:00Z',
}

describe('createApiClient meal updates', () => {
  it('replaces the selected meal through the authenticated endpoint', async () => {
    const authedFetch = vi.fn(async () =>
      new Response(JSON.stringify(meal), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const client = createApiClient(authedFetch)

    await client.updateMeal(meal.id, {
      entryDate: meal.entryDate,
      meal: meal.meal,
      foodName: meal.foodName,
      quantity: meal.quantity,
      measure: meal.measure ?? undefined,
      groups: meal.groups,
    })

    expect(authedFetch).toHaveBeenCalledOnce()
    expect(authedFetch).toHaveBeenCalledWith(
      `/v1/meals/${meal.id}`,
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryDate: meal.entryDate,
          meal: meal.meal,
          foodName: meal.foodName,
          quantity: meal.quantity,
          measure: meal.measure,
          groups: meal.groups,
        }),
        signal: expect.any(AbortSignal),
      }),
    )
  })
})

describe('createApiClient friend removal', () => {
  it('revokes the selected friendship through the authenticated endpoint', async () => {
    const authedFetch = vi.fn(async () => new Response(null, { status: 204 }))
    const client = createApiClient(authedFetch)

    await client.removeFriend('friend/id')

    expect(authedFetch).toHaveBeenCalledOnce()
    expect(authedFetch).toHaveBeenCalledWith(
      '/v1/friends/friend%2Fid',
      expect.objectContaining({ method: 'DELETE', signal: expect.any(AbortSignal) }),
    )
  })
})

describe('createApiClient Afi photo chat', () => {
  it('forwards the abort signal to the authenticated request', async () => {
    const authedFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          conversationId: 'conversation-1',
          kind: 'question',
          text: 'Biraz daha yakından çeker misin?',
          quickReplies: [],
          needsPhoto: true,
          food: null,
          extraFoods: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    const client = createApiClient(authedFetch)
    const controller = new AbortController()

    await client.afiPhotoChat({ imageBase64: 'photo-data' }, controller.signal)

    expect(authedFetch).toHaveBeenCalledWith(
      '/v1/afi/photo-chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: 'photo-data' }),
        signal: expect.any(AbortSignal),
      }),
    )
  })
})

describe('createApiClient request timeout', () => {
  it('aborts a stalled request and exposes it to the live-query error state', async () => {
    vi.useFakeTimers()
    let requestSignal: AbortSignal | undefined
    const authedFetch = vi.fn((_path: string, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined
      // Deliberately ignore the signal to model a stuck auth refresh or transport.
      return new Promise<Response>(() => undefined)
    })
    const client = createApiClient(authedFetch, { requestTimeoutMs: 50 })
    const outcomePromise = executeLiveQuery(() => client.getSummary('2026-07-20'))

    await vi.advanceTimersByTimeAsync(50)
    const outcome = await outcomePromise

    expect(requestSignal?.aborted).toBe(true)
    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.error).toBeInstanceOf(ApiRequestTimeoutError)
      expect(outcome.error.message).toBe(
        'Bağlantı zaman aşımına uğradı. Tekrar deneyebilirsin.',
      )
    }
  })

  it('forwards caller cancellation without misreporting a timeout', async () => {
    const caller = new AbortController()
    let requestSignal: AbortSignal | undefined
    const authedFetch = vi.fn(
      (_path: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          requestSignal = init?.signal ?? undefined
          requestSignal?.addEventListener('abort', () => {
            const error = new Error('Caller aborted')
            error.name = 'AbortError'
            reject(error)
          })
        }),
    )
    const client = createApiClient(authedFetch)
    const request = client
      .afiPhotoChat({ imageBase64: 'photo-data' }, caller.signal)
      .catch((error: unknown) => error)

    caller.abort()

    expect(requestSignal?.aborted).toBe(true)
    await expect(request).resolves.toMatchObject({ name: 'AbortError', message: 'Caller aborted' })
  })
})
