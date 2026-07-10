/**
 * Bağımlılıksız değişiklik yayıcısı — Dexie liveQuery'nin native karşılığının
 * temeli. Repository mutasyonları notify() çağırır, useLive abone olur.
 */
export type TableName = 'profiles' | 'meals' | 'water' | 'customFoods' | 'measurements'

const subs = new Map<TableName, Set<() => void>>()

export function subscribe(tables: TableName[], cb: () => void): () => void {
  for (const t of tables) {
    let set = subs.get(t)
    if (!set) {
      set = new Set()
      subs.set(t, set)
    }
    set.add(cb)
  }
  return () => {
    for (const t of tables) subs.get(t)?.delete(cb)
  }
}

export function notify(...tables: TableName[]) {
  const called = new Set<() => void>()
  for (const t of tables) {
    for (const cb of subs.get(t) ?? []) {
      if (!called.has(cb)) {
        called.add(cb)
        cb()
      }
    }
  }
}
