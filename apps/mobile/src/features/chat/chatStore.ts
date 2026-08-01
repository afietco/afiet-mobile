import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AssistantId, ChatTurn } from './types'

/**
 * Chat history lives ONLY on this device (privacy decision for phase 1; the
 * destek conversation especially must not reach any server-side transcript).
 * Keys are account-scoped like ftueFlags so histories never cross accounts.
 */

const PREFIX = 'fh:chat:account:'
/** Oldest turns are dropped beyond this; also caps what phase 3 replays. */
const MAX_STORED_TURNS = 60

const storageKey = (accountId: string, assistant: AssistantId) =>
  `${PREFIX}${encodeURIComponent(accountId)}:${assistant}`

export async function loadChatHistory(
  accountId: string,
  assistant: AssistantId,
): Promise<ChatTurn[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(accountId, assistant))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t): t is ChatTurn =>
        t != null &&
        typeof t === 'object' &&
        typeof (t as ChatTurn).text === 'string' &&
        ((t as ChatTurn).role === 'user' || (t as ChatTurn).role === 'assistant'),
    )
  } catch {
    // A broken payload starts the conversation fresh; nothing else depends on it.
    return []
  }
}

export function saveChatHistory(
  accountId: string,
  assistant: AssistantId,
  turns: ChatTurn[],
): void {
  const trimmed = turns.slice(-MAX_STORED_TURNS)
  void AsyncStorage.setItem(storageKey(accountId, assistant), JSON.stringify(trimmed)).catch(
    () => undefined,
  )
}

export async function clearChatHistory(
  accountId: string,
  assistant: AssistantId,
): Promise<void> {
  await AsyncStorage.removeItem(storageKey(accountId, assistant)).catch(() => undefined)
}
