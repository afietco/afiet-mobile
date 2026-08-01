import { useCallback, useEffect, useRef, useState } from 'react'
import { todayISO } from '@afiet/core'
import { clearChatHistory, loadChatHistory, saveChatHistory } from './chatStore'
import { mockTransport } from './mockTransport'
import type { AssistantId, ChatTurn } from './types'

/** Swapped for the real SSE transport in phase 3; the hook API stays put. */
const transport = mockTransport

export type ChatPhase = 'idle' | 'waiting' | 'streaming'

const OFFLINE_TEXT: Record<AssistantId, string> = {
  afi: 'Şu an sana ulaşamıyorum, bağlantı gidip geliyor sanki. Birazdan yeniden dener misin?',
  beslenme: 'Şu an bağlanamadım. Yazdıkların burada duruyor; birazdan yeniden deneyelim.',
  destek: 'Şu an bağlanamadım ama yazdıkların kaybolmadı, burada. Birazdan yeniden dener misin?',
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
      // Offline bubbles are transient UI, not conversation content.
      saveChatHistory(accountId, assistant, list.filter((t) => !t.offline))
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
    (raw: string) => {
      const text = raw.trim()
      if (!text || phase !== 'idle' || turns === null) return

      const userTurn: ChatTurn = { id: nextId(), role: 'user', text, date: todayISO() }
      const base = [...turnsRef.current.filter((t) => !t.offline), userTurn]
      commit(base)
      setPhase('waiting')
      setLiveText('')

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
          commit([
            ...turnsRef.current,
            { id: nextId(), role: 'assistant', text: full, date: todayISO() },
          ])
        })
        .catch((err: unknown) => {
          if (isAbort(err)) return
          const next: ChatTurn[] = [
            ...turnsRef.current,
            {
              id: nextId(),
              role: 'assistant',
              text: OFFLINE_TEXT[assistant],
              date: todayISO(),
              offline: true,
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
