import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendGreeting, sentToday, useGreetings } from './greetings'

const mocks = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message)
    }
  }
  return { api: { sendGreeting: vi.fn() }, MockApiError }
})

vi.mock('@/data/api/apiHolder', () => ({ requireApi: () => mocks.api }))
vi.mock('@/data/api/client', () => ({ ApiError: mocks.MockApiError }))
vi.mock('react', () => ({
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}))

beforeEach(() => {
  mocks.api.sendGreeting.mockReset()
})

describe('optimistic group greetings', () => {
  it('rolls back and rejects when the request fails', async () => {
    const error = new Error('Network request failed')
    mocks.api.sendGreeting.mockRejectedValue(error)

    const request = sendGreeting('group-1', 'rollback-user', '2026-07-20')

    expect(sentToday(useGreetings(), 'rollback-user')).toBe(true)
    await expect(request).rejects.toBe(error)
    expect(sentToday(useGreetings(), 'rollback-user')).toBe(false)
  })

  it('keeps the settled state for an already-sent conflict', async () => {
    mocks.api.sendGreeting.mockRejectedValue(new mocks.MockApiError(409, 'Already sent'))

    await expect(sendGreeting('group-1', 'settled-user', '2026-07-20')).resolves.toBeUndefined()

    expect(sentToday(useGreetings(), 'settled-user')).toBe(true)
  })
})
