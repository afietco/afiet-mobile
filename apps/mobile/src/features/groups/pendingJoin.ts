import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  normalizeInviteCode,
  normalizeInviteLabel,
  type GroupInviteContext,
  type PendingGroupInvite,
} from './inviteContext'

export const PENDING_JOIN_STORAGE_KEY = 'afiet:groups:pending-join:v1'
export const PENDING_JOIN_TTL_MS = 24 * 60 * 60 * 1000

interface StoredPendingJoin {
  version: 1
  expiresAt: number
  invite: PendingGroupInvite
}

/**
 * Short-lived bridge between invitation deep links, authentication, onboarding,
 * and the group screen. Memory keeps synchronous consumers simple while
 * AsyncStorage preserves the invitation across application restarts.
 */
let pending: StoredPendingJoin | null = null
const listeners = new Set<() => void>()
let storageQueue: Promise<void> = Promise.resolve()

function enqueueStorage<T>(operation: () => Promise<T>): Promise<T> {
  const run = storageQueue.catch(() => undefined).then(operation)
  storageQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function persistPending(value: StoredPendingJoin | null): Promise<void> {
  const operation = value
    ? () => AsyncStorage.setItem(PENDING_JOIN_STORAGE_KEY, JSON.stringify(value))
    : () => AsyncStorage.removeItem(PENDING_JOIN_STORAGE_KEY)
  return enqueueStorage(operation).catch(() => undefined)
}

function parseStoredPendingJoin(raw: string): StoredPendingJoin | null {
  try {
    const value = JSON.parse(raw) as Partial<StoredPendingJoin>
    const invite = value.invite as Partial<PendingGroupInvite> | undefined
    const code = normalizeInviteCode(invite?.code ?? '')
    if (
      value.version !== 1 ||
      typeof value.expiresAt !== 'number' ||
      !Number.isFinite(value.expiresAt) ||
      code.length !== 8
    ) {
      return null
    }
    return {
      version: 1,
      expiresAt: value.expiresAt,
      invite: {
        code,
        groupName: normalizeInviteLabel(invite?.groupName),
        inviterName: normalizeInviteLabel(invite?.inviterName),
      },
    }
  } catch {
    return null
  }
}

function activeInvite(now = Date.now()): PendingGroupInvite | null {
  if (!pending || pending.expiresAt <= now) return null
  return pending.invite
}

export async function loadPendingJoin(now = Date.now()): Promise<void> {
  let raw: string | null
  try {
    raw = await enqueueStorage(() => AsyncStorage.getItem(PENDING_JOIN_STORAGE_KEY))
  } catch {
    return
  }
  const stored = raw ? parseStoredPendingJoin(raw) : null
  if (!stored || stored.expiresAt <= now) {
    pending = null
    if (raw) await persistPending(null)
  } else {
    pending = stored
  }
  for (const listener of listeners) listener()
}

export function setPendingJoin(
  raw: string,
  context: GroupInviteContext = {},
  now = Date.now(),
): Promise<void> {
  const code = normalizeInviteCode(raw)
  pending =
    code.length === 8
      ? {
          version: 1,
          expiresAt: now + PENDING_JOIN_TTL_MS,
          invite: {
            code,
            groupName: normalizeInviteLabel(context.groupName),
            inviterName: normalizeInviteLabel(context.inviterName),
          },
        }
      : null
  const write = persistPending(pending)
  for (const listener of listeners) listener()
  return write
}

export function peekPendingJoin(now = Date.now()): PendingGroupInvite | null {
  return activeInvite(now)
}

export function consumePendingJoin(): string | null {
  const code = activeInvite()?.code ?? null
  pending = null
  void persistPending(null)
  return code
}

export function clearPendingJoin(): Promise<void> {
  pending = null
  const write = persistPending(null)
  for (const listener of listeners) listener()
  return write
}

export function onPendingJoin(l: () => void): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
