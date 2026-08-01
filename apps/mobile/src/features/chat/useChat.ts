import { useCallback, useEffect, useRef, useState } from 'react'
import { todayISO } from '@afiet/core'
import { track } from '@/lib/track'
import { clearChatHistory, loadChatHistory, saveChatHistory } from './chatStore'
import { ChatRequestError, sseTransport } from './sseTransport'
import type { AssistantId, ChatDraftAttachment, ChatTurn } from './types'

const transport = sseTransport

export type ChatPhase = 'idle' | 'waiting' | 'streaming'

const OFFLINE_TEXT: Record<AssistantId, string> = {
  afi: 'Şu an sana ulaşamıyorum, bağlantı gidip geliyor sanki. Birazdan yeniden dener misin?',
  beslenme: 'Şu an bağlanamadım. Yazdıkların burada duruyor; birazdan yeniden deneyelim.',
  destek: 'Şu an bağlanamadım ama yazdıkların kaybolmadı, burada. Birazdan yeniden dener misin?',
}

/**
 * What the assistant can say about an attachment today.
 *
 * The conversation endpoint carries words and nothing else, so a photo or a
 * voice message reaches the screen and stops there. Saying so is the only
 * honest option: silence would read as an answer that never came, and a made-up
 * reply would be worse than either. The photo line points at the one place in
 * the app where a picture IS understood, which is the add-food flow.
 *
 * When the endpoint learns to carry them, this is the branch that goes: the
 * attachment travels with the turn and the notice stops being written.
 */
const ATTACHMENT_NOTICE: Record<'image' | 'audio', string> = {
  image:
    'Fotoğrafı aldım, ama sohbette henüz bakamıyorum. Bir besini fotoğraftan tanımamı istersen Besin Ekle akışında yanındayım 🌱',
  audio:
    'Sesli mesajın burada duruyor, ama henüz dinleyemiyorum. Yazarsan hemen okuyup cevap veriyorum 🌱',
}

let seq = 0
const nextId = () => `c${String(++seq)}`

const isAbort = (err: unknown) => err instanceof Error && err.name === 'AbortError'

export function useChat(assistant: AssistantId, accountId: string | null) {
  /** null while history is loading; the screen shows its skeleton then. */
  const [turns, setTurns] = useState<ChatTurn[] | null>(null)
  const [liveText, setLiveText] = useState('')
  const [phase, setPhase] = useState<ChatPhase>('idle')
  // State updates flow through the ref first: send() may fire while a render
  // with stale `turns` is still on screen (starter chip double-tap).
  const turnsRef = useRef<ChatTurn[]>([])
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    setTurns(null)
    turnsRef.current = []
    if (!accountId) {
      setTurns([])
      return
    }
    void loadChatHistory(accountId, assistant).then((history) => {
      if (cancelled) return
      turnsRef.current = history
      setTurns(history)
    })
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
  }, [assistant, accountId])

  const persist = useCallback(
    (list: ChatTurn[]) => {
      if (!accountId) return
      // Offline/notice bubbles are transient UI, not conversation content.
      saveChatHistory(accountId, assistant, list.filter((t) => !t.offline && !t.notice))
    },
    [accountId, assistant],
  )

  const commit = useCallback(
    (list: ChatTurn[]) => {
      turnsRef.current = list
      setTurns(list)
      persist(list)
    },
    [persist],
  )

  const send = useCallback(
    (raw: string, attachment?: ChatDraftAttachment | null) => {
      const text = raw.trim()
      if ((!text && !attachment) || phase !== 'idle' || turns === null) return

      const userTurn: ChatTurn = {
        id: nextId(),
        role: 'user',
        text,
        date: todayISO(),
        /* The upload payload is dropped here on purpose: what a turn keeps is
           what it needs to be drawn again, and base64 belongs to the request. */
        attachment: attachment
          ? { kind: attachment.kind, uri: attachment.uri, durationMs: attachment.durationMs }
          : undefined,
      }
      const base = [...turnsRef.current.filter((t) => !t.offline && !t.notice), userTurn]
      commit(base)

      if (attachment) {
        /* Said straight away, and before any reply to the words beside it, so
           the answer is never mistaken for an answer about the attachment. */
        const noticed: ChatTurn[] = [
          ...base,
          {
            id: nextId(),
            role: 'assistant',
            text: ATTACHMENT_NOTICE[attachment.kind],
            date: todayISO(),
            notice: true,
          },
        ]
        turnsRef.current = noticed
        setTurns(noticed)
        track('chat_attachment_sent', { asistan: assistant, tur: attachment.kind })
        /* Nothing typed means nothing to ask, so the turn ends here. */
        if (!text) return
      }

      setPhase('waiting')
      setLiveText('')

      // Telemetry stays content-free: the assistant id and timings, nothing
      // the user typed.
      track('chat_message_sent', { asistan: assistant })
      const startedAt = Date.now()

      const controller = new AbortController()
      abortRef.current = controller
      transport
        .send({
          assistant,
          history: base.slice(0, -1),
          text,
          signal: controller.signal,
          onToken: (token) => {
            setPhase('streaming')
            setLiveText((prev) => prev + token)
          },
        })
        .then((full) => {
          track('chat_reply_completed', { asistan: assistant, sure_ms: Date.now() - startedAt })
          commit([
            ...turnsRef.current,
            { id: nextId(), role: 'assistant', text: full, date: todayISO() },
          ])
        })
        .catch((err: unknown) => {
          if (isAbort(err)) return
          // A server notice (daily limit and friends) speaks in its own warm
          // words; anything else is the generic offline bubble.
          const userMessage = err instanceof ChatRequestError ? err.userMessage : null
          const next: ChatTurn[] = [
            ...turnsRef.current,
            {
              id: nextId(),
              role: 'assistant',
              text: userMessage ?? OFFLINE_TEXT[assistant],
              date: todayISO(),
              offline: userMessage == null,
              notice: userMessage != null,
            },
          ]
          turnsRef.current = next
          setTurns(next)
        })
        .finally(() => {
          if (abortRef.current === controller) {
            abortRef.current = null
            setPhase('idle')
            setLiveText('')
          }
        })
    },
    [assistant, commit, phase, turns],
  )

  const clear = useCallback(() => {
    track('chat_cleared', { asistan: assistant })
    abortRef.current?.abort()
    abortRef.current = null
    setPhase('idle')
    setLiveText('')
    turnsRef.current = []
    setTurns([])
    if (accountId) void clearChatHistory(accountId, assistant)
  }, [accountId, assistant])

  return { turns, liveText, phase, send, clear }
}
