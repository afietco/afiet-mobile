/**
 * Bağımlılıksız değişiklik yayıcısı; Dexie liveQuery'nin native karşılığının
 * temeli. Repository mutasyonları notify() çağırır, useLive abone olur.
 */
/**
 * `groups` has no local table behind it: group state lives in its own module
 * store. It is a live key all the same, because joining, leaving and greeting
 * change what the server reports for quests, level and league.
 *
 * `goalDirections` is the same shape: the direction log is persisted on
 * AsyncStorage, not in sqlite, but it is a live key so choosing a direction
 * refreshes the screens reading it.
 *
 * `sofras` lives only on the server. It is a live key because two screens read
 * it (Menüm builds them, the add-food step offers them) and a sofra saved on
 * one has to appear on the other without a reload.
 *
 * `kese` is the same: the weekly allowance is the server's to count, and a
 * message spends one without touching any local table. Sending is what
 * notifies it, so the number moves on every screen showing it.
 */
export const TABLE_NAMES = [
  'profiles',
  'meals',
  'water',
  'customFoods',
  'measurements',
  'goalDirections',
  'groups',
  'sofras',
  'kese',
] as const

export type TableName = (typeof TABLE_NAMES)[number]

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

/**
 * Wakes every live query exactly once (notify already dedupes callbacks across
 * tables). Used when something changed that is not attributable to one table:
 * a snapshot painted on a cold start being replaced by the server's real
 * answer. A rerun is cheap in that case because the fresh value is already
 * sitting in the request cache.
 */
export function notifyAll() {
  notify(...TABLE_NAMES)
}
