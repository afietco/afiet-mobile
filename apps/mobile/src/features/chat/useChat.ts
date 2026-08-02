import { useCallback, useEffect, useRef, useState } from 'react'
import { todayISO } from '@afiet/core'
import * as Crypto from 'expo-crypto'
import { refreshKese } from '@/features/kese/useKese'
import { track } from '@/lib/track'
import {
  loadSessions,
  loadSessionTurns,
  removeSession,
  saveSession,
  sessionTitle,
  setSessionPinned,
} from './chatStore'
import { ChatRequestError, sseTransport } from './sseTransport'
import type { AssistantId, ChatDraftAttachment, ChatSessionMeta, ChatTurn } from './types'

const transport = sseTransport

export type ChatPhase = 'idle' | 'waiting' | 'streaming'

const OFFLINE_TEXT: Record<AssistantId, string> = {
  afi: 'Şu an sana ulaşamıyorum, bağlantı gidip geliyor sanki. Birazdan yeniden dener misin?',
  beslenme: 'Şu an bağlanamadım. Yazdıkların burada duruyor; birazdan yeniden deneyelim.',
  destek: 'Şu an bağlanamadım ama yazdıkların kaybolmadı, burada. Birazdan yeniden dener misin?',
}

/**
 * What the assistant can say about a photo today.
 *
 * The conversation endpoint carries words and nothing else, so a photo reaches
 * the screen and stops there. Saying so is the only honest option: silence
 * would read as an answer that never came, and a made-up reply would be worse
 * than either. The line points at the one place in the app where a picture IS
 * understood, which is the add-food flow.
 *
 * When the endpoint learns to carry it, this is the branch that goes: the
 * attachment travels with the turn and the notice stops being written.
 */
const ATTACHMENT_NOTICE =
  'Fotoğrafı aldım, ama sohbette henüz bakamıyorum. Bir besini fotoğraftan tanımamı istersen Besin Ekle akışında yanındayım 🌱'

let seq = 0
const nextId = () => `c${String(++seq)}`

const isAbort = (err: unknown) => err instanceof Error && err.name === 'AbortError'

/**
 * One assistant's conversations, and the one being read.
 *
 * A conversation is created by talking, not by asking for it: "yeni sohbet"
 * only clears the screen, and nothing is written until there is something to
 * write. That way the list holds conversations rather than the record of every
 * time someone opened the screen and changed their mind.
 */
export function useChat(assistant: AssistantId, accountId: string | null) {
  /** null while history is loading; the screen shows its skeleton then. */
  const [turns, setTurns] = useState<ChatTurn[] | null>(null)
  const [sessions, setSessions] = useState<ChatSessionMeta[]>([])
  /** null means a fresh conversation that has not earned a place yet. */
  const [activeId, setActiveId] = useState<string | null>(null)
  const [liveText, setLiveText] = useState('')
  const [phase, setPhase] = useState<ChatPhase>('idle')
  // State updates flow through the ref first: send() may fire while a render
  // with stale `turns` is still on screen (starter chip double-tap).
  const turnsRef = useRef<ChatTurn[]>([])
  const activeIdRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const setActive = useCallback((id: string | null) => {
    activeIdRef.current = id
    setActiveId(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    setTurns(null)
    setSessions([])
    turnsRef.current = []
    if (!accountId) {
      setTurns([])
      return
    }
    /**
     * Opening the screen opens a new conversation, never the last one.
     *
     * Coming back to an assistant almost always means having something else to
     * ask, and landing in the middle of a finished exchange makes the next
     * question look like part of it. The old conversations are one tap away in
     * the panel, which is where going back to one belongs.
     */
    setActive(null)
    turnsRef.current = []
    setTurns([])
    void loadSessions(accountId, assistant).then((list) => {
      if (cancelled) return
      setSessions(list)
    })
    return () => {
      cancelled = true
      abortRef.current?.abort()
    }
  }, [assistant, accountId, setActive])

  /**
   * Writes the conversation as it now stands.
   *
   * The id is minted here rather than when the screen was opened, because this
   * is the first moment there is a conversation at all. Offline and notice
   * bubbles are transient UI, not conversation content, and never persist.
   */
  const persist = useCallback(
    (list: ChatTurn[]) => {
      if (!accountId) return
      const content = list.filter((t) => !t.offline && !t.notice)
      if (content.length === 0) return
      const id = activeIdRef.current ?? Crypto.randomUUID()
      if (activeIdRef.current !== id) setActive(id)
      const meta: ChatSessionMeta = {
        id,
        title: sessionTitle(content),
        pinned: sessions.find((s) => s.id === id)?.pinned ?? false,
        updatedAt: Date.now(),
      }
      void saveSession(accountId, assistant, meta, content).then(setSessions)
    },
    [accountId, assistant, sessions, setActive],
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
        attachment: attachment ? { kind: attachment.kind, uri: attachment.uri } : undefined,
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
            text: ATTACHMENT_NOTICE,
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
          /* The server counts the kese when it accepts the request, so the
             number moves however this ended: a stream that failed halfway
             still cost the call it made, and the chip has to say so. */
          refreshKese()
          if (abortRef.current === controller) {
            abortRef.current = null
            setPhase('idle')
            setLiveText('')
          }
        })
    },
    [assistant, commit, phase, turns],
  )

  /** Leaves whatever is on screen where it is and starts an empty one. */
  const startSession = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setPhase('idle')
    setLiveText('')
    turnsRef.current = []
    setActive(null)
    setTurns([])
    track('chat_session_started', { asistan: assistant })
  }, [assistant, setActive])

  const openSession = useCallback(
    (id: string) => {
      if (!accountId || id === activeIdRef.current) return
      abortRef.current?.abort()
      abortRef.current = null
      setPhase('idle')
      setLiveText('')
      setTurns(null)
      void loadSessionTurns(accountId, assistant, id).then((history) => {
        turnsRef.current = history
        setActive(id)
        setTurns(history)
      })
    },
    [accountId, assistant, setActive],
  )

  const deleteSession = useCallback(
    (id: string) => {
      if (!accountId) return
      track('chat_session_deleted', { asistan: assistant })
      void removeSession(accountId, assistant, id).then((list) => {
        setSessions(list)
        /* Deleting the one you are reading has to leave you somewhere: the
           next most recent conversation, or an empty one. */
        if (activeIdRef.current !== id) return
        const next = list[0]
        if (!next) {
          turnsRef.current = []
          setActive(null)
          setTurns([])
          return
        }
        void loadSessionTurns(accountId, assistant, next.id).then((history) => {
          turnsRef.current = history
          setActive(next.id)
          setTurns(history)
        })
      })
    },
    [accountId, assistant, setActive],
  )

  const togglePin = useCallback(
    (id: string) => {
      if (!accountId) return
      const pinned = !sessions.find((s) => s.id === id)?.pinned
      void setSessionPinned(accountId, assistant, id, pinned).then(setSessions)
    },
    [accountId, assistant, sessions],
  )

  return {
    turns,
    liveText,
    phase,
    send,
    sessions,
    activeId,
    startSession,
    openSession,
    deleteSession,
    togglePin,
  }
}
