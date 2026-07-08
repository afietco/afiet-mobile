import { useCallback, useSyncExternalStore } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../data/db'

const KEY = 'fh:activeProfileId'
const listeners = new Set<() => void>()

function readId(): number | null {
  const raw = localStorage.getItem(KEY)
  return raw ? Number(raw) : null
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setActiveProfileId(id: number | null) {
  if (id === null) localStorage.removeItem(KEY)
  else localStorage.setItem(KEY, String(id))
  listeners.forEach((l) => l())
}

/** Aktif profil id'si localStorage'da tutulur — cihaz paylaşımı için hızlı geçiş */
export function useActiveProfile() {
  const id = useSyncExternalStore(subscribe, readId)
  const profile = useLiveQuery(
    async () => (id ? ((await db.profiles.get(id)) ?? null) : null),
    [id],
  )
  const clear = useCallback(() => setActiveProfileId(null), [])
  return { id, profile: profile ?? null, loading: id !== null && profile === undefined, clear }
}
