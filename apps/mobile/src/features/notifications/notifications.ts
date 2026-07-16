import { useSyncExternalStore } from 'react'
import { todayISO } from '@afiet/core'

/**
 * Bildirim merkezi: MOCK katman. Uygulama içi bildirimler (afiyet olsun
 * selamları; ileride push'a düşecek tetikleyiciler) tek listede birikir,
 * ana ekranların sağ üstündeki zilden açılır.
 *
 * Backend bağlanınca liste sunucudan gelecek (greetings + push arşivi);
 * arayüz repository desenindeki gibi dar tutuldu ki geçiş UI'a dokunmasın.
 */

export interface AppNotification {
  id: string
  /** İleride push tipleri de eklenecek (t1-t7 tetikleyicileri vb.). */
  kind: 'greeting'
  emoji: string
  text: string
  /** Yerel YYYY-MM-DD. */
  date: string
  read: boolean
}

interface NotificationsState {
  items: AppNotification[]
}

// DEMO tohumu: zil akışı cihazda görülebilsin diye açılışta bir selam
// bekliyor. Backend bağlanınca kalkar.
const state: NotificationsState = {
  items: [
    {
      id: 'seed-1',
      kind: 'greeting',
      emoji: '🧡',
      text: 'Ayşe afiyet olsun dedi',
      date: todayISO(),
      read: false,
    },
  ],
}

const listeners = new Set<() => void>()
let snapshot: NotificationsState = { items: [...state.items] }

function emit() {
  snapshot = { items: [...state.items] }
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useNotifications(): NotificationsState {
  return useSyncExternalStore(subscribe, () => snapshot)
}

export function unreadCount(s: NotificationsState): number {
  return s.items.filter((n) => !n.read).length
}

/** Zil açıldığında tümü okundu sayılır (nokta söner, liste kalır). */
export function markAllRead() {
  if (!state.items.some((n) => !n.read)) return
  state.items = state.items.map((n) => (n.read ? n : { ...n, read: true }))
  emit()
}
