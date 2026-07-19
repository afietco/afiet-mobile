import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

/**
 * FTUE bir-kez-göster bayrakları — AsyncStorage `fh:ftue:<anahtar>` (web paritesi).
 * AsyncStorage async olduğundan bayraklar açılışta bir kez belleğe yüklenir
 * (root layout, splash gizlenmeden önce); sonrası web'deki gibi sync okunur.
 */
export type FtueKey =
  | 'firstMealCelebrated'
  | 'starterShown'
  | 'starterDone'
  | 'introBeslenme'
  | 'introGecmis'
  | 'welcomeIntro'

const KEYS: FtueKey[] = [
  'firstMealCelebrated',
  'starterShown',
  'starterDone',
  'introBeslenme',
  'introGecmis',
  'welcomeIntro',
]

const PREFIX = 'fh:ftue:'
const seen = new Set<FtueKey>()
const listeners = new Set<() => void>()
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

/** Root layout splash gizlenmeden önce çağırır */
export async function loadFtueFlags(): Promise<void> {
  const generation = storeGeneration
  try {
    const pairs = await enqueueStorage(() =>
      AsyncStorage.multiGet(KEYS.map((key) => PREFIX + key)),
    )
    if (generation !== storeGeneration) return
    seen.clear()
    for (const [key, value] of pairs) {
      if (value === '1') seen.add(key.slice(PREFIX.length) as FtueKey)
    }
  } catch {
    // okunamazsa bayraksız devam — en kötü ihtimalle kutlama bir kez daha görünür
  }
  if (generation === storeGeneration) emit()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function ftueSeen(key: FtueKey): boolean {
  return seen.has(key)
}

export function markFtueSeen(key: FtueKey) {
  if (seen.has(key)) return
  seen.add(key)
  void enqueueStorage(() => AsyncStorage.setItem(PREFIX + key, '1')).catch(() => undefined)
  emit()
}

export function useFtueSeen(key: FtueKey): boolean {
  return useSyncExternalStore(subscribe, () => ftueSeen(key))
}

/** Clears in-memory and persisted first-time experience state for the next account. */
export async function resetFtueFlags(): Promise<void> {
  storeGeneration += 1
  seen.clear()
  emit()
  await enqueueStorage(() => AsyncStorage.multiRemove(KEYS.map((key) => PREFIX + key)))
}
