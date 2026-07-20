import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

/** First-time flags shown before authentication. */
const GLOBAL_KEYS = ['firstMealCelebrated', 'firstValueCaptured', 'welcomeIntro'] as const

/** First-time flags that must never cross account boundaries. */
const ACCOUNT_KEYS = [
  'afiGuideStarted',
  'afiGuideIntroSeen',
  'afiGuideDone',
  'starterShown',
  'starterDone',
  'introBeslenme',
  'introGecmis',
] as const

export type FtueKey = (typeof GLOBAL_KEYS)[number] | (typeof ACCOUNT_KEYS)[number]

const ALL_KEYS: FtueKey[] = [...GLOBAL_KEYS, ...ACCOUNT_KEYS]
const GLOBAL_KEY_SET = new Set<FtueKey>(GLOBAL_KEYS)
const LEGACY_PREFIX = 'fh:ftue:'
const GLOBAL_PREFIX = 'fh:ftue:global:'
const ACCOUNT_PREFIX = 'fh:ftue:account:'

const globalSeen = new Set<FtueKey>()
const accountSeen = new Set<FtueKey>()
const listeners = new Set<() => void>()
let activeAccountId: string | null = null
let storeGeneration = 0
let storageQueue: Promise<void> = Promise.resolve()

function emit() {
  listeners.forEach((listener) => listener())
}

function enqueueStorage<T>(operation: () => Promise<T>): Promise<T> {
  const run = storageQueue.catch(() => undefined).then(operation)
  storageQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function globalStorageKey(key: FtueKey): string {
  return GLOBAL_PREFIX + key
}

function accountStorageKey(accountId: string, key: FtueKey): string {
  return `${ACCOUNT_PREFIX}${encodeURIComponent(accountId)}:${key}`
}

/** Hydrates only pre-authentication flags before the splash screen is hidden. */
export async function loadFtueFlags(): Promise<void> {
  const generation = ++storeGeneration
  const keys = GLOBAL_KEYS.map(globalStorageKey)
  const legacyKeys = GLOBAL_KEYS.map((key) => LEGACY_PREFIX + key)
  try {
    const pairs = await enqueueStorage(() => AsyncStorage.multiGet([...keys, ...legacyKeys]))
    if (generation !== storeGeneration) return
    globalSeen.clear()
    for (const key of GLOBAL_KEYS) {
      const current = pairs.find(([storedKey]) => storedKey === globalStorageKey(key))?.[1]
      const legacy = pairs.find(([storedKey]) => storedKey === LEGACY_PREFIX + key)?.[1]
      if (current === '1' || legacy === '1') globalSeen.add(key)
    }
  } catch {
    // Empty flags are safe: the worst outcome is repeating a pre-auth introduction.
  }
  if (generation === storeGeneration) emit()
}

/** Switches the in-memory FTUE view to one authenticated account. */
export async function loadFtueAccountFlags(accountId: string): Promise<void> {
  const generation = ++storeGeneration
  activeAccountId = accountId
  accountSeen.clear()
  emit()
  try {
    const pairs = await enqueueStorage(() =>
      AsyncStorage.multiGet(ACCOUNT_KEYS.map((key) => accountStorageKey(accountId, key))),
    )
    if (generation !== storeGeneration || activeAccountId !== accountId) return
    for (const [key, value] of pairs) {
      if (value !== '1') continue
      const flag = key.slice(key.lastIndexOf(':') + 1) as FtueKey
      accountSeen.add(flag)
    }
  } catch {
    // A storage failure starts this account with empty flags instead of leaking another account.
  }
  if (generation === storeGeneration && activeAccountId === accountId) emit()
}

function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

export function ftueSeen(key: FtueKey): boolean {
  return GLOBAL_KEY_SET.has(key) ? globalSeen.has(key) : accountSeen.has(key)
}

export function markFtueSeen(key: FtueKey) {
  if (GLOBAL_KEY_SET.has(key)) {
    if (globalSeen.has(key)) return
    globalSeen.add(key)
    void enqueueStorage(() => AsyncStorage.setItem(globalStorageKey(key), '1')).catch(
      () => undefined,
    )
    emit()
    return
  }

  // Account flags are ignored while no authenticated scope is active. This
  // prevents a screen unmounting during sign-out from repopulating stale state.
  const accountId = activeAccountId
  if (!accountId || accountSeen.has(key)) return
  accountSeen.add(key)
  void enqueueStorage(() => AsyncStorage.setItem(accountStorageKey(accountId, key), '1')).catch(
    () => undefined,
  )
  emit()
}

export function useFtueSeen(key: FtueKey): boolean {
  return useSyncExternalStore(subscribe, () => ftueSeen(key))
}

/** Requires the explicit completion marker, not a legacy auto-finished flag. */
export function useAfiGuideCompleted(): boolean {
  const done = useFtueSeen('afiGuideDone')
  const completionConfirmed = useFtueSeen('starterDone')
  return done && completionConfirmed
}

/** Clears the active account and every pre-auth flag before another session starts. */
export async function resetFtueFlags(): Promise<void> {
  const accountId = activeAccountId
  storeGeneration += 1
  activeAccountId = null
  globalSeen.clear()
  accountSeen.clear()
  emit()

  const keys = [
    ...GLOBAL_KEYS.map(globalStorageKey),
    ...(accountId
      ? ACCOUNT_KEYS.map((key) => accountStorageKey(accountId, key))
      : []),
    ...ALL_KEYS.map((key) => LEGACY_PREFIX + key),
  ]
  await enqueueStorage(() => AsyncStorage.multiRemove(keys))
}
