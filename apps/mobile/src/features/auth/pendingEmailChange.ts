import AsyncStorage from '@react-native-async-storage/async-storage'

export const PENDING_EMAIL_CHANGE_STORAGE_KEY = 'afiet:auth:pending-email-change:v1'

export type PendingEmailChangePhase = 'waiting' | 'finalizing'

export interface PendingEmailChange {
  userId: string
  channelId: string
  email: string
  phase: PendingEmailChangePhase
}

interface StoredPendingEmailChange extends PendingEmailChange {
  version: 1
}

function parsePendingEmailChange(raw: string): StoredPendingEmailChange | null {
  try {
    const value = JSON.parse(raw) as Partial<StoredPendingEmailChange>
    if (
      value.version !== 1 ||
      typeof value.userId !== 'string' ||
      !value.userId ||
      typeof value.channelId !== 'string' ||
      !value.channelId ||
      typeof value.email !== 'string' ||
      !value.email.includes('@') ||
      (value.phase !== 'waiting' && value.phase !== 'finalizing')
    ) {
      return null
    }
    return value as StoredPendingEmailChange
  } catch {
    return null
  }
}

export async function savePendingEmailChange(change: PendingEmailChange): Promise<void> {
  const stored: StoredPendingEmailChange = { version: 1, ...change }
  await AsyncStorage.setItem(PENDING_EMAIL_CHANGE_STORAGE_KEY, JSON.stringify(stored))
}

export async function loadPendingEmailChange(userId: string): Promise<PendingEmailChange | null> {
  const raw = await AsyncStorage.getItem(PENDING_EMAIL_CHANGE_STORAGE_KEY)
  if (!raw) return null
  const stored = parsePendingEmailChange(raw)
  if (!stored || stored.userId !== userId) {
    await AsyncStorage.removeItem(PENDING_EMAIL_CHANGE_STORAGE_KEY)
    return null
  }
  return {
    userId: stored.userId,
    channelId: stored.channelId,
    email: stored.email,
    phase: stored.phase,
  }
}

export function clearPendingEmailChange(): Promise<void> {
  return AsyncStorage.removeItem(PENDING_EMAIL_CHANGE_STORAGE_KEY)
}
