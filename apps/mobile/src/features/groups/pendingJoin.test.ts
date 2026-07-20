import { afterEach, describe, expect, it, vi } from 'vitest'
import { consumePendingJoin, onPendingJoin, peekPendingJoin, setPendingJoin } from './pendingJoin'

afterEach(() => {
  consumePendingJoin()
})

describe('pending group invitation', () => {
  it('preserves safe display context until the group code is consumed', () => {
    setPendingJoin('abc12345', {
      groupName: ' Aile Sofrası ',
      inviterName: ' Ayşe ',
    })

    expect(peekPendingJoin()).toEqual({
      code: 'ABC12345',
      groupName: 'Aile Sofrası',
      inviterName: 'Ayşe',
    })
    expect(consumePendingJoin()).toBe('ABC12345')
    expect(peekPendingJoin()).toBeNull()
  })

  it('rejects invalid codes and notifies invitation listeners', () => {
    const listener = vi.fn()
    const unsubscribe = onPendingJoin(listener)

    setPendingJoin('short', { inviterName: 'Ayşe' })

    expect(peekPendingJoin()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })
})
