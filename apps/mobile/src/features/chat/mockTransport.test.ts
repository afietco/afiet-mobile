import { describe, expect, it } from 'vitest'
import { mockTransport } from './mockTransport'
import type { ChatTurn } from './types'

const noHistory: ChatTurn[] = []

describe('mockTransport', () => {
  it('streams tokens that concatenate to the resolved reply', async () => {
    let streamed = ''
    const full = await mockTransport.send({
      assistant: 'beslenme',
      sessionId: 's1',
      history: noHistory,
      text: 'Haftamı değerlendir',
      onToken: (t) => {
        streamed += t
      },
    })
    expect(full.length).toBeGreaterThan(0)
    expect(streamed).toBe(full)
    expect(full).toContain('bakliyat')
  })

  it('rejects with AbortError when the signal fires mid-stream', async () => {
    const controller = new AbortController()
    const promise = mockTransport.send({
      assistant: 'afi',
      sessionId: 's1',
      history: noHistory,
      text: 'merhaba',
      signal: controller.signal,
      onToken: () => controller.abort(),
    })
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('varies the fallback when the previous fallback is already on screen', async () => {
    const first = await mockTransport.send({
      assistant: 'destek',
      sessionId: 's1',
      history: noHistory,
      text: 'xyz',
      onToken: () => undefined,
    })
    const second = await mockTransport.send({
      assistant: 'destek',
      sessionId: 's1',
      history: [
        { id: '1', role: 'user', text: 'xyz', date: '2026-08-01' },
        { id: '2', role: 'assistant', text: first, date: '2026-08-01' },
      ],
      text: 'xyz',
      onToken: () => undefined,
    })
    expect(second).not.toBe(first)
  })
})
