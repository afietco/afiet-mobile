import { todayISO } from '@afiet/core'
import { requireStreamFetch } from '@/data/api/apiHolder'
import { createSSEParser } from './sse'
import type { ChatTransport, ChatTurn } from './types'

/**
 * Real transport: POST /v1/afi/sohbet over the session-bound expo/fetch and
 * stream the SSE reply. The wire protocol mirrors the landing assistant
 * (status/delta/error/done events, `: ping` heartbeats).
 */

/** Carries the server's own warm message (e.g. the daily-limit 429). */
export class ChatRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly userMessage: string | null,
  ) {
    super(message)
    this.name = 'ChatRequestError'
  }
}

/**
 * Folds the flat turn list into the {question, answer} exchanges the backend
 * replays. Pairing matters: the server caps history by PAIR count, so one
 * exchange must cost one slot, not two. Offline/notice bubbles are UI, not
 * conversation, and never leave the device.
 */
export function toExchangePairs(history: ChatTurn[]): { question: string; answer: string }[] {
  const pairs: { question: string; answer: string }[] = []
  for (const t of history) {
    if (t.offline || t.notice) continue
    if (t.role === 'user') {
      pairs.push({ question: t.text, answer: '' })
    } else if (pairs.length > 0 && pairs[pairs.length - 1].answer === '') {
      pairs[pairs.length - 1].answer = t.text
    } else {
      pairs.push({ question: '', answer: t.text })
    }
  }
  return pairs
}

async function errorFrom(res: Response): Promise<ChatRequestError> {
  let userMessage: string | null = null
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    userMessage = body.error?.message ?? null
  } catch {
    // A non-JSON error body (proxy page, empty) falls back to generic copy.
  }
  return new ChatRequestError(`chat HTTP ${String(res.status)}`, res.status, userMessage)
}

export const sseTransport: ChatTransport = {
  async send({ assistant, sessionId, history, text, onToken, signal }) {
    const res = await requireStreamFetch()('/v1/afi/sohbet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        assistant,
        sessionId,
        message: text,
        date: todayISO(),
        history: toExchangePairs(history),
      }),
      signal,
    })

    if (!res.ok) throw await errorFrom(res)
    if (!res.body) throw new ChatRequestError('chat: stream body yok', res.status, null)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    const parser = createSSEParser()
    let full = ''
    let upstreamFailed = false

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      for (const ev of parser.feed(decoder.decode(value, { stream: true }))) {
        if (ev.event === 'delta') {
          const payload = JSON.parse(ev.data) as { t?: string }
          if (payload.t) {
            full += payload.t
            onToken(payload.t)
          }
        } else if (ev.event === 'error') {
          upstreamFailed = true
        }
      }
    }

    if (upstreamFailed && full === '') {
      throw new ChatRequestError('chat: upstream error frame', 200, null)
    }
    return full
  },
}
