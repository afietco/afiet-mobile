import { describe, expect, it, vi } from 'vitest'
import { SessionEpoch } from './sessionEpoch'

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('SessionEpoch', () => {
  it('prevents a stale refresh response from starting a token write', async () => {
    const session = new SessionEpoch()
    const epoch = session.beginSession()
    const write = vi.fn(async () => {})

    session.invalidate()

    await expect(session.persistIfCurrent(epoch, write)).resolves.toBe(false)
    expect(write).not.toHaveBeenCalled()
  })

  it('lets sign-out wait for an already-started token write before clearing storage', async () => {
    const session = new SessionEpoch()
    const epoch = session.beginSession()
    const write = deferred()
    const order: string[] = []

    const persistence = session.persistIfCurrent(epoch, async () => {
      await write.promise
      order.push('write')
    })
    session.invalidate()
    const signOut = session.waitForPendingWrites().then(() => order.push('clear'))

    await Promise.resolve()
    expect(order).toEqual([])

    write.resolve()
    await Promise.all([persistence, signOut])

    expect(await persistence).toBe(false)
    expect(order).toEqual(['write', 'clear'])
  })

  it('persists tokens for the active session', async () => {
    const session = new SessionEpoch()
    const epoch = session.beginSession()
    const write = vi.fn(async () => {})

    await expect(session.persistIfCurrent(epoch, write)).resolves.toBe(true)
    expect(write).toHaveBeenCalledOnce()
  })
})
