import { useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import {
  getAcceptedEvents,
  getIncomingRequests,
  subscribeSocialChange,
} from '@/features/social/mockStore'

/**
 * Bildirim merkezi: GET /v1/notifications üzerinde ince istemci önbelleği.
 * Zil her ekranda mount olduğunda tazelenir; sheet açılınca ack ile tümü
 * okundu işaretlenir (optimistik, sunucu imleci arkada güncellenir).
 * Ağ yoksa son bilinen liste gösterilmeye devam eder, hata yutulur.
 *
 * Sosyal katman: arkadaşlık bildirimleri (friend_request | friend_accepted)
 * şimdilik backend'den GELMEZ; mockStore'dan türetilip selamlarla aynı listede
 * birleştirilir. Liste sosyal durum değiştikçe (istek kabul/ret) otomatik
 * yenilenir. MOCK: backend arkadaşlık uçları gelince bu türetme kalkar.
 */

export interface AppNotification {
  id: string
  kind: 'greeting' | 'friend_request' | 'friend_accepted'
  emoji: string
  text: string
  /** Yerel YYYY-MM-DD. */
  date: string
  read: boolean
  /** friend_request: kabul/ret için arkadaşlık isteği id'si (mockStore). */
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

/* ── Kaynak önbellekleri ──────────────────────────────────────────────────── */

// API'den gelen selamlar (kind: 'greeting'); tazelemede güncellenir, çevrimdışı
// kalırsa son bilinen liste korunur.
let lastGreetings: AppNotification[] = []
// MOCK: yerel okundu imleci, sheet açılınca işaretlenen id'ler yeniden
// kurulumlarda (sosyal değişiklik) okundu kalsın diye tutulur.
const readIds = new Set<string>()

/** kind'e göre emoji + metin (yargısız, sakin ton). */
function presentSocial(
  kind: 'friend_request' | 'friend_accepted',
  username: string,
): { emoji: string; text: string } {
  switch (kind) {
    case 'friend_request':
      return { emoji: '🤝', text: `@${username} seni arkadaş olarak eklemek istiyor` }
    case 'friend_accepted':
      return { emoji: '🎉', text: `@${username} arkadaşlık isteğini kabul etti` }
  }
}

/** MOCK: mockStore'daki gelen istekleri + kabul olaylarını bildirime çevir. */
function socialItems(): AppNotification[] {
  const out: AppNotification[] = []
  for (const r of getIncomingRequests()) {
    const { emoji, text } = presentSocial('friend_request', r.username)
    out.push({
      id: `n-fr-${r.id}`,
      kind: 'friend_request',
      emoji,
      text,
      date: r.createdAt,
      read: false,
      requestId: r.id,
      fromUserId: r.userId,
      fromUsername: r.username,
    })
  }
  for (const e of getAcceptedEvents()) {
    const { emoji, text } = presentSocial('friend_accepted', e.username)
    out.push({
      id: `n-fa-${e.id}`,
      kind: 'friend_accepted',
      emoji,
      text,
      date: e.createdAt,
      read: false,
      fromUserId: e.userId,
      fromUsername: e.username,
    })
  }
  return out
}

/** Yerel okundu imlecini uygula (kaynak read ya da işaretlenmişse okundu). */
function applyRead(items: AppNotification[]): AppNotification[] {
  return items.map((n) => (n.read || readIds.has(n.id) ? { ...n, read: true } : n))
}

/** Sosyal bildirimler + selamları birleştirip listeyi kur (arkadaşlık üstte). */
function rebuild() {
  state.items = applyRead([...socialItems(), ...lastGreetings])
  emit()
}

/** Sunucudan listeyi tazele (zil mount olunca ve sheet açılınca). */
export async function refreshNotifications(): Promise<void> {
  try {
    const { items } = await requireApi().notifications()
    lastGreetings = items
      .filter((n) => n.kind === 'greeting')
      .map((n) => ({
        id: n.id,
        kind: 'greeting' as const,
        emoji: '🧡',
        text: `${n.fromName.trim() || 'Bir sofra arkadaşın'} afiyet olsun dedi`,
        date: n.date,
        read: n.read,
      }))
  } catch {
    // çevrimdışı / giriş yok: son bilinen selamlar kalır
  }
  // MOCK: arkadaşlık bildirimlerini mockStore'dan türetip selamlarla birleştir.
  rebuild()
}

/** Zil açıldığında tümü okundu sayılır (nokta söner, liste kalır). */
export function markAllRead() {
  const unread = state.items.filter((n) => !n.read)
  if (unread.length === 0) return
  for (const n of unread) readIds.add(n.id)
  rebuild()
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

// MOCK: sosyal durum (istek kabul/ret, yeni istek) değiştikçe bildirim listesi
// kendini yeniler; ekranlar acceptRequest/declineRequest çağırınca zil ve liste
// otomatik güncellenir. Uygulama boyu tek köprü, temizlenmesi gerekmez.
subscribeSocialChange(rebuild)
// İlk sosyal bildirimleri hemen doldur (zil mount olmadan da nokta doğru olsun).
rebuild()
