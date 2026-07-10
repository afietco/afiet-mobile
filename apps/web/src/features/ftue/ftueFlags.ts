import { useSyncExternalStore } from 'react'

/**
 * FTUE bir-kez-göster bayrakları — localStorage `fh:ftue:<anahtar>`.
 * Veriden türeyen durumlar (ilk öğün var mı vb.) burada tutulmaz;
 * bayraklar yalnızca "bu an bir kez yaşandı/gösterildi" bilgisini taşır.
 */
export type FtueKey =
  | 'firstMealCelebrated'
  | 'starterShown'
  | 'starterDone'
  | 'introBeslenme'
  | 'introGecmis'

const PREFIX = 'fh:ftue:'
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function ftueSeen(key: FtueKey): boolean {
  return localStorage.getItem(PREFIX + key) === '1'
}

export function markFtueSeen(key: FtueKey) {
  if (ftueSeen(key)) return
  localStorage.setItem(PREFIX + key, '1')
  listeners.forEach((l) => l())
}

export function useFtueSeen(key: FtueKey): boolean {
  return useSyncExternalStore(subscribe, () => ftueSeen(key))
}
