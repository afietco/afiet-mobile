import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AssistantId, ChatSessionMeta, ChatTurn } from './types'

/**
 * Conversations live ONLY on this device (privacy decision for phase 1; the
 * destek conversation especially must not reach any server-side transcript).
 * Keys are account-scoped like ftueFlags so histories never cross accounts.
 *
 * One assistant holds many conversations, and they are stored in two pieces:
 * an index of what exists, and one entry per conversation holding its turns.
 * The split is what keeps writing cheap. Every message rewrites its own
 * conversation, and a single blob would rewrite every conversation the person
 * has ever had, on every message.
 */

const PREFIX = 'fh:chat:account:'
/** Oldest turns are dropped beyond this; also caps what the transport replays. */
const MAX_STORED_TURNS = 60
/** Oldest unpinned conversations are dropped beyond this. */
const MAX_SESSIONS = 30

/** Where the single conversation per assistant used to live. */
const legacyKey = (accountId: string, assistant: AssistantId) =>
  `${PREFIX}${encodeURIComponent(accountId)}:${assistant}`

const indexKey = (accountId: string, assistant: AssistantId) =>
  `${legacyKey(accountId, assistant)}:index`

const turnsKey = (accountId: string, assistant: AssistantId, sessionId: string) =>
  `${legacyKey(accountId, assistant)}:s:${sessionId}`

function isTurn(value: unknown): value is ChatTurn {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as ChatTurn).text === 'string' &&
    ((value as ChatTurn).role === 'user' || (value as ChatTurn).role === 'assistant')
  )
}

function isMeta(value: unknown): value is ChatSessionMeta {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as ChatSessionMeta).id === 'string' &&
    typeof (value as ChatSessionMeta).title === 'string'
  )
}

/**
 * Pinned first, then most recently touched. Sorting on read rather than on
 * write means a pin never has to rewrite the order it was stored in.
 */
export function sortSessions(sessions: ChatSessionMeta[]): ChatSessionMeta[] {
  return [...sessions].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
    return b.updatedAt - a.updatedAt
  })
}

async function readIndex(
  accountId: string,
  assistant: AssistantId,
): Promise<ChatSessionMeta[] | null> {
  try {
    const raw = await AsyncStorage.getItem(indexKey(accountId, assistant))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter(isMeta)
  } catch {
    return null
  }
}

function writeIndex(
  accountId: string,
  assistant: AssistantId,
  sessions: ChatSessionMeta[],
): void {
  void AsyncStorage.setItem(indexKey(accountId, assistant), JSON.stringify(sessions)).catch(
    () => undefined,
  )
}

/**
 * The conversation that existed before conversations were plural.
 *
 * Everyone upgrading has one, and it is the conversation they were in the
 * middle of. It becomes the first session rather than being dropped or left
 * unreachable under a key nothing reads any more.
 */
async function adoptLegacyHistory(
  accountId: string,
  assistant: AssistantId,
): Promise<ChatSessionMeta[]> {
  try {
    const raw = await AsyncStorage.getItem(legacyKey(accountId, assistant))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    const turns = Array.isArray(parsed) ? parsed.filter(isTurn) : []
    if (turns.length === 0) return []
    const meta: ChatSessionMeta = {
      id: 'legacy',
      title: sessionTitle(turns),
      pinned: false,
      updatedAt: Date.now(),
    }
    await AsyncStorage.setItem(turnsKey(accountId, assistant, meta.id), JSON.stringify(turns))
    writeIndex(accountId, assistant, [meta])
    await AsyncStorage.removeItem(legacyKey(accountId, assistant)).catch(() => undefined)
    return [meta]
  } catch {
    return []
  }
}

/** Every conversation this account has with this assistant, in display order. */
export async function loadSessions(
  accountId: string,
  assistant: AssistantId,
): Promise<ChatSessionMeta[]> {
  const stored = await readIndex(accountId, assistant)
  if (stored) return sortSessions(stored)
  return sortSessions(await adoptLegacyHistory(accountId, assistant))
}

export async function loadSessionTurns(
  accountId: string,
  assistant: AssistantId,
  sessionId: string,
): Promise<ChatTurn[]> {
  try {
    const raw = await AsyncStorage.getItem(turnsKey(accountId, assistant, sessionId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isTurn)
  } catch {
    // A broken payload starts that conversation fresh; nothing else depends on it.
    return []
  }
}

/**
 * Names a conversation after the first thing said in it, the way the list
 * needs it: something recognisable at a glance, cut to one line.
 */
export function sessionTitle(turns: ChatTurn[]): string {
  const first = turns.find((t) => t.role === 'user' && t.text.trim().length > 0)
  const text = first?.text.trim().replace(/\s+/g, ' ') ?? ''
  if (!text) return 'Yeni sohbet'
  return text.length > 42 ? `${text.slice(0, 42).trimEnd()}…` : text
}

/**
 * Writes a conversation and its place in the index.
 *
 * Returns the index as it now stands, because the caller draws from it and a
 * second read would race the write that just happened.
 */
export async function saveSession(
  accountId: string,
  assistant: AssistantId,
  meta: ChatSessionMeta,
  turns: ChatTurn[],
): Promise<ChatSessionMeta[]> {
  const kept = turns.slice(-MAX_STORED_TURNS)
  void AsyncStorage.setItem(
    turnsKey(accountId, assistant, meta.id),
    JSON.stringify(kept),
  ).catch(() => undefined)

  const current = (await readIndex(accountId, assistant)) ?? []
  const next = sortSessions([...current.filter((s) => s.id !== meta.id), meta])

  /* A pinned conversation is one the person said to keep, so the cap is spent
     on the unpinned tail instead. */
  const dropped = next.slice(MAX_SESSIONS).filter((s) => !s.pinned)
  const kept_sessions = next.filter((s) => !dropped.includes(s))
  for (const session of dropped) {
    void AsyncStorage.removeItem(turnsKey(accountId, assistant, session.id)).catch(
      () => undefined,
    )
  }
  writeIndex(accountId, assistant, kept_sessions)
  return kept_sessions
}

export async function removeSession(
  accountId: string,
  assistant: AssistantId,
  sessionId: string,
): Promise<ChatSessionMeta[]> {
  const current = (await readIndex(accountId, assistant)) ?? []
  const next = current.filter((s) => s.id !== sessionId)
  writeIndex(accountId, assistant, next)
  await AsyncStorage.removeItem(turnsKey(accountId, assistant, sessionId)).catch(
    () => undefined,
  )
  return sortSessions(next)
}

export async function setSessionPinned(
  accountId: string,
  assistant: AssistantId,
  sessionId: string,
  pinned: boolean,
): Promise<ChatSessionMeta[]> {
  const current = (await readIndex(accountId, assistant)) ?? []
  const next = current.map((s) => (s.id === sessionId ? { ...s, pinned } : s))
  writeIndex(accountId, assistant, next)
  return sortSessions(next)
}
