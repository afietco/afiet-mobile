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

const KEYS: FtueKey[] = [
  'firstMealCelebrated',
  'starterShown',
  'starterDone',
  'introBeslenme',
  'introGecmis',
]

const PREFIX = 'fh:ftue:'
const seen = new Set<FtueKey>()
const listeners = new Set<() => void>()

/** Root layout splash gizlenmeden önce çağırır */
export async function loadFtueFlags(): Promise<void> {
  try {
    const pairs = await AsyncStorage.multiGet(KEYS.map((k) => PREFIX + k))
    for (const [key, value] of pairs) {
      if (value === '1') seen.add(key.slice(PREFIX.length) as FtueKey)
    }
  } catch {
    // okunamazsa bayraksız devam — en kötü ihtimalle kutlama bir kez daha görünür
  }
  listeners.forEach((l) => l())
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
  void AsyncStorage.setItem(PREFIX + key, '1')
  listeners.forEach((l) => l())
}

export function useFtueSeen(key: FtueKey): boolean {
  return useSyncExternalStore(subscribe, () => ftueSeen(key))
}
