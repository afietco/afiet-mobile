import {
  normalizeInviteCode,
  normalizeInviteLabel,
  type GroupInviteContext,
  type PendingGroupInvite,
} from './inviteContext'

/**
 * In-memory bridge between invitation deep links, authentication, and the
 * group screen. The group screen consumes the code after authentication while
 * the login screen can inspect the optional display context without consuming it.
 */
let pending: PendingGroupInvite | null = null
const listeners = new Set<() => void>()

export function setPendingJoin(raw: string, context: GroupInviteContext = {}): void {
  const code = normalizeInviteCode(raw)
  pending =
    code.length === 8
      ? {
          code,
          groupName: normalizeInviteLabel(context.groupName),
          inviterName: normalizeInviteLabel(context.inviterName),
        }
      : null
  for (const l of listeners) l()
}

export function peekPendingJoin(): PendingGroupInvite | null {
  return pending
}

export function consumePendingJoin(): string | null {
  const code = pending?.code ?? null
  pending = null
  return code
}

export function onPendingJoin(l: () => void): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
