import { describe, expect, it } from 'vitest'
import { RequestTurnGuard } from './requestTurnGuard'

describe('RequestTurnGuard', () => {
  it('aborts the active request and rejects its response when the sheet closes', () => {
    const guard = new RequestTurnGuard()
    guard.openSession()
    const turn = guard.start()

    expect(turn).not.toBeNull()
    guard.closeSession()

    expect(turn?.signal.aborted).toBe(true)
    expect(guard.isCurrent(turn!.id)).toBe(false)
  })

  it('rejects an older response after a new turn starts', () => {
    const guard = new RequestTurnGuard()
    guard.openSession()
    const first = guard.start()!
    const second = guard.start()!

    expect(first.signal.aborted).toBe(true)
    expect(guard.isCurrent(first.id)).toBe(false)
    expect(guard.isCurrent(second.id)).toBe(true)
  })

  it('does not start a request after the sheet closes', () => {
    const guard = new RequestTurnGuard()
    guard.openSession()
    guard.closeSession()

    expect(guard.start()).toBeNull()
  })
})
