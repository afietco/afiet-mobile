import { describe, expect, it } from 'vitest'
import { toExchangePairs } from './sseTransport'
import type { ChatTurn } from './types'

const turn = (role: ChatTurn['role'], text: string, extra?: Partial<ChatTurn>): ChatTurn => ({
  id: text,
  role,
  text,
  date: '2026-08-01',
  ...extra,
})

describe('toExchangePairs', () => {
  it('folds alternating turns into one pair per exchange', () => {
    const pairs = toExchangePairs([
      turn('user', 's1'),
      turn('assistant', 'c1'),
      turn('user', 's2'),
      turn('assistant', 'c2'),
    ])
    expect(pairs).toEqual([
      { question: 's1', answer: 'c1' },
      { question: 's2', answer: 'c2' },
    ])
  })

  it('keeps offline and notice bubbles off the wire', () => {
    const pairs = toExchangePairs([
      turn('user', 's1'),
      turn('assistant', 'çevrimdışıydım', { offline: true }),
      turn('assistant', 'limit doldu', { notice: true }),
      turn('assistant', 'c1'),
    ])
    expect(pairs).toEqual([{ question: 's1', answer: 'c1' }])
  })

  it('tolerates an assistant-first history without inventing questions', () => {
    const pairs = toExchangePairs([turn('assistant', 'hoş geldin'), turn('user', 's1')])
    expect(pairs).toEqual([
      { question: '', answer: 'hoş geldin' },
      { question: 's1', answer: '' },
    ])
  })
})
