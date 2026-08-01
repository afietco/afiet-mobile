import { describe, expect, it } from 'vitest'
import { sessionTitle, sortSessions } from '../../apps/mobile/src/features/chat/chatStore'
import type { ChatSessionMeta, ChatTurn } from '../../apps/mobile/src/features/chat/types'

const turn = (role: 'user' | 'assistant', text: string): ChatTurn => ({
  id: `${role}-${text}`,
  role,
  text,
  date: '2026-08-01',
})

const meta = (id: string, updatedAt: number, pinned = false): ChatSessionMeta => ({
  id,
  title: id,
  pinned,
  updatedAt,
})

describe('chat session titles', () => {
  it('names a conversation after the first thing the person said', () => {
    expect(
      sessionTitle([
        turn('assistant', 'Hoş geldin!'),
        turn('user', 'Cacık iyi mi'),
        turn('user', 'bir de ayran'),
      ]),
    ).toBe('Cacık iyi mi')
  })

  it('collapses whitespace and cuts a long opener to one line', () => {
    const long = 'a'.repeat(80)
    const title = sessionTitle([turn('user', long)])
    expect(title.length).toBeLessThanOrEqual(43)
    expect(title.endsWith('…')).toBe(true)
    expect(sessionTitle([turn('user', 'iki   satır\nolmuş')])).toBe('iki satır olmuş')
  })

  it('falls back when the person has only sent an attachment', () => {
    // An attachment-only turn carries no text, so there is nothing to name it
    // after until something is typed.
    expect(sessionTitle([turn('user', '   ')])).toBe('Yeni sohbet')
    expect(sessionTitle([])).toBe('Yeni sohbet')
  })
})

describe('chat session order', () => {
  it('keeps pinned conversations above everything, newest first inside each group', () => {
    const order = sortSessions([
      meta('eski', 100),
      meta('yeni', 300),
      meta('sabit-eski', 50, true),
      meta('sabit-yeni', 200, true),
    ]).map((s) => s.id)

    expect(order).toEqual(['sabit-yeni', 'sabit-eski', 'yeni', 'eski'])
  })

  it('does not mutate what it was given', () => {
    const input = [meta('a', 1), meta('b', 2)]
    sortSessions(input)
    expect(input.map((s) => s.id)).toEqual(['a', 'b'])
  })
})
