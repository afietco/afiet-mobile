/**
 * Bağımlılıksız değişiklik yayıcısı; Dexie liveQuery'nin native karşılığının
 * temeli. Repository mutasyonları notify() çağırır, useLive abone olur.
 */
/**
 * `groups` has no local table behind it: group state lives in its own module
 * store. It is a live key all the same, because joining, leaving and greeting
 * change what the server reports for quests, level and league.
 */
export type TableName =
  | 'profiles'
  | 'meals'
  | 'water'
  | 'customFoods'
  | 'measurements'
  | 'groups'

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
