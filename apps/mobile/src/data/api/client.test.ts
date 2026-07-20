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
