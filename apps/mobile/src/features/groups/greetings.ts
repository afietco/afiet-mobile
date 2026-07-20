import { useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import { ApiError } from '@/data/api/client'

/**
 * Session-scoped optimistic state for the group greeting endpoint. Conflicts
 * remain settled, while other failures roll back; `member.greetedToday` stays
 * the persistent cross-device source of truth.
 */

interface GreetingsState {
  /** Member IDs greeted today in the optimistic session layer. */
  sentTo: Set<string>
}

const state: GreetingsState = {
  sentTo: new Set(),
}

const listeners = new Set<() => void>()
let snapshot = { sentTo: new Set(state.sentTo) }

function emit() {
  snapshot = { sentTo: new Set(state.sentTo) }
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useGreetings() {
  return useSyncExternalStore(subscribe, () => snapshot)
}

/** Returns whether the optimistic session layer includes this member. */
export function sentToday(s: { sentTo: Set<string> }, userId: string): boolean {
  return s.sentTo.has(userId)
}

/** Marks the greeting optimistically and rejects if the rollback needs user feedback. */
export async function sendGreeting(groupId: string, toUserId: string, date: string): Promise<void> {
  state.sentTo.add(toUserId)
  emit()
  try {
    await requireApi().sendGreeting(groupId, toUserId, date)
  } catch (error) {
    // A conflict means the greeting is already settled and should stay sent.
    if (error instanceof ApiError && error.status === 409) return
    state.sentTo.delete(toUserId)
    emit()
    throw error
  }
}
