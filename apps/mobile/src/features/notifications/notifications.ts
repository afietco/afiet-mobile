import { useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'

/**
 * Bildirim merkezi: GET /v1/notifications üzerinde ince istemci önbelleği.
 * Zil her ekranda mount olduğunda tazelenir; sheet açılınca ack ile tümü
 * okundu işaretlenir (optimistik — sunucu imleci arkada güncellenir).
 * Ağ yoksa son bilinen liste gösterilmeye devam eder, hata yutulur.
 */

export interface AppNotification {
  id: string
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

const state: NotificationsState = { items: [] }

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

/** Sunucudan listeyi tazele (zil mount olunca ve sheet açılınca). */
export async function refreshNotifications(): Promise<void> {
  try {
    const { items } = await requireApi().notifications()
    state.items = items.map((n) => ({
      id: n.id,
      kind: n.kind,
      emoji: '🧡',
      text: `${n.fromName.trim() || 'Bir sofra arkadaşın'} afiyet olsun dedi`,
      date: n.date,
      read: n.read,
    }))
    emit()
  } catch {
    // çevrimdışı / giriş yok: son bilinen liste kalır
  }
}

/** Zil açıldığında tümü okundu sayılır (nokta söner, liste kalır). */
export function markAllRead() {
  if (!state.items.some((n) => !n.read)) return
  state.items = state.items.map((n) => (n.read ? n : { ...n, read: true }))
  emit()
  try {
    requireApi()
      .ackNotifications()
      .catch(() => {
        // imleç sunucuda güncellenemedi: bir sonraki tazelemede tekrar denenir
      })
  } catch {
    // giriş yok: yerel işaret yeterli
  }
}
