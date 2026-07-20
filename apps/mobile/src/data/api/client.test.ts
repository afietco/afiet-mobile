import { describe, expect, it, vi } from 'vitest'
import { createApiClient, type ApiMeal } from './client'

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
    expect(authedFetch).toHaveBeenCalledWith(`/v1/meals/${meal.id}`, {
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
    })
  })
})

describe('createApiClient friend removal', () => {
  it('revokes the selected friendship through the authenticated endpoint', async () => {
    const authedFetch = vi.fn(async () => new Response(null, { status: 204 }))
    const client = createApiClient(authedFetch)

    await client.removeFriend('friend/id')

    expect(authedFetch).toHaveBeenCalledOnce()
    expect(authedFetch).toHaveBeenCalledWith('/v1/friends/friend%2Fid', {
      method: 'DELETE',
    })
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

    expect(authedFetch).toHaveBeenCalledWith('/v1/afi/photo-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'photo-data' }),
      signal: controller.signal,
    })
  })
})
