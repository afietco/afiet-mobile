import { describe, expect, it } from 'vitest'
import { createSSEParser } from './sse'

describe('createSSEParser', () => {
  it('parses complete frames and ignores heartbeat comments', () => {
    const p = createSSEParser()
    const events = p.feed(
      'event: status\ndata: {"state":"thinking"}\n\n: ping\n\nevent: delta\ndata: {"t":"Merhaba"}\n\n',
    )
    expect(events).toEqual([
      { event: 'status', data: '{"state":"thinking"}' },
      { event: 'delta', data: '{"t":"Merhaba"}' },
    ])
  })

  it('survives frames split anywhere across chunks', () => {
    const p = createSSEParser()
    const whole = 'event: delta\ndata: {"t":"parça parça"}\n\nevent: done\ndata: {"answered":true}\n\n'
    const collected = []
    for (const ch of whole) collected.push(...p.feed(ch))
    expect(collected).toEqual([
      { event: 'delta', data: '{"t":"parça parça"}' },
      { event: 'done', data: '{"answered":true}' },
    ])
  })

  it('holds an incomplete trailing frame until it closes', () => {
    const p = createSSEParser()
    expect(p.feed('event: delta\ndata: {"t":"yarım')).toEqual([])
    expect(p.feed('"}\n\n')).toEqual([{ event: 'delta', data: '{"t":"yarım"}' }])
  })
})
