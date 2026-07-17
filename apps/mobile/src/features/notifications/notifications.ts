import { useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import type { ApiNotification } from '@/data/api/client'

/**
 * Bildirim merkezi: GET /v1/notifications üzerinde ince istemci önbelleği.
 * Zil her ekranda mount olduğunda tazelenir; sheet açılınca ack ile tümü
 * okundu işaretlenir (optimistik, sunucu imleci arkada güncellenir).
 * Ağ yoksa son bilinen liste gösterilmeye devam eder, hata yutulur.
 *
 * Selamlar (greeting) ve sosyal katmanın arkadaşlık bildirimleri
 * (friend_request | friend_accepted) aynı listede birikir; hepsi backend'den
 * gelir. friend_request kalemi requestId taşır → doğrudan kabul/ret edilebilir.
 */

export interface AppNotification {
  id: string
  kind: 'greeting' | 'friend_request' | 'friend_accepted'
  emoji: string
  text: string
  /** Yerel YYYY-MM-DD. */
  date: string
  read: boolean
  /** friend_request: kabul/ret için arkadaşlık isteği id'si. */
  requestId?: string
  /** friend_request | friend_accepted: ilgili kullanıcı. */
  fromUserId?: string
  fromUsername?: string
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

/** Bir bildirim kalemini (kind'e göre) emoji + yargısız, sakin metne çevir. */
function present(n: ApiNotification): AppNotification {
  const username = n.fromUsername?.trim() || ''
  const base = { id: n.id, date: n.date, read: n.read }
  switch (n.kind) {
    case 'friend_request':
      return {
        ...base,
        kind: 'friend_request',
        emoji: '🤝',
        text: username
          ? `@${username} seni arkadaş olarak eklemek istiyor`
          : 'Biri seni arkadaş olarak eklemek istiyor',
        requestId: n.requestId,
        fromUserId: n.fromUserId,
        fromUsername: n.fromUsername,
      }
    case 'friend_accepted':
      return {
        ...base,
        kind: 'friend_accepted',
        emoji: '🎉',
        text: username
          ? `@${username} arkadaşlık isteğini kabul etti`
          : 'Arkadaşlık isteğin kabul edildi',
        fromUserId: n.fromUserId,
        fromUsername: n.fromUsername,
      }
    default:
      return {
        ...base,
        kind: 'greeting',
        emoji: '🧡',
        text: `${n.fromName.trim() || 'Bir sofra arkadaşın'} afiyet olsun dedi`,
      }
  }
}

/** Sunucudan listeyi tazele (zil mount olunca ve sheet açılınca). */
export async function refreshNotifications(): Promise<void> {
  try {
    const { items } = await requireApi().notifications()
    state.items = items.map(present)
    emit()
  } catch {
    // çevrimdışı / giriş yok: son bilinen liste korunur
  }
}

/**
 * Bir arkadaşlık isteği bildirimini yerelde hemen düşür (kabul/ret dokununca).
 * Sunucu da ack/işlem sonrası artık döndürmez; bu yalnız anlık geri bildirim.
 */
export function dismissRequest(requestId: string) {
  const before = state.items.length
  state.items = state.items.filter((n) => n.requestId !== requestId)
  if (state.items.length !== before) emit()
}

/** Zil açıldığında tümü okundu sayılır (nokta söner, liste kalır). */
export function markAllRead() {
  const unread = state.items.some((n) => !n.read)
  if (!unread) return
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
