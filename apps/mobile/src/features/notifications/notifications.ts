import { useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import type { ApiNotification } from '@/data/api/client'

/**
 * Bildirim merkezi: GET /v1/notifications üzerinde ince istemci önbelleği.
 * Zil her ekranda mount olduğunda tazelenir. Ağ yoksa son bilinen liste
 * gösterilmeye devam eder, hata yutulur.
 *
 * Zil birincil kanaldır: sosyal olaylar (selam, arkadaşlık) ve kişinin
 * kazandığı kutlamalar aynı listede birikir. Kutlamalar push kapısının
 * kararına bakmaz: gönderilmeyen bildirim kaybolmuş değil, burada sessizce
 * duruyor demektir. Hatırlatmalar bilerek gelmez.
 *
 * Okundu KALEM BAŞINADIR: dokunulan kalem okunur, sheet'in açılması bir şeyi
 * okumuş saymaz. Toplu işaret ("hepsini okundu say") ayrı bir eylemdir.
 */

/** Kutlama türleri: metinlerini sunucudan getirirler. */
const CELEBRATION_EMOJI: Record<string, string> = {
  week_closure: '🎉',
  week_summary: '📖',
  streak_3: '🌱',
  first_measurement: '📏',
  meal_10: '🍲',
  first_custom_food: '📝',
  quest_reward: '🏅',
}

export interface AppNotification {
  id: string
  kind: string
  emoji: string
  text: string
  /** Kutlamaların ikinci satırı (sunucudaki gövde); sosyal kalemlerde yok. */
  detail?: string
  /** Yerel YYYY-MM-DD. */
  date: string
  read: boolean
  /** friend_request | group_invite: kabul/ret için isteğin id'si. */
  requestId?: string
  /** Sosyal kalemlerde ilgili kullanıcı. */
  fromUserId?: string
  /** Dokununca gidilecek yer; push ile aynı jeton kümesi. */
  target?: string
  /**
   * Sebebi hâlâ açık. Sunucu böyle bir kalemi okundu saymaz, o yüzden yerelde
   * de okunmuş gösterilmez: aksi hâlde kalem "Yeni"den çıkar ve bir sonraki
   * tazelemede geri gelir.
   */
  pending?: boolean
}

interface NotificationsState {
  items: AppNotification[]
}

const state: NotificationsState = { items: [] }

const listeners = new Set<() => void>()
let snapshot: NotificationsState = { items: [...state.items] }
let storeGeneration = 0

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

/**
 * Bir bildirim kalemini (kind'e göre) emoji + yargısız, sakin metne çevir.
 *
 * Sosyal kalemlerin cümlesini uygulama kurar, çünkü elinde zaten bir ad var.
 * Kutlamaların cümlesi sunucudan gelir: aynı metin push'a da gidiyor ve
 * panelden düzenlenebiliyor, ikinci bir kopya yazmak ikisini ayrıştırırdı.
 * Tanınmayan tür metinsiz gelirse hiç çizilmez (aşağıda süzülür).
 */
function present(n: ApiNotification): AppNotification | null {
  const who = n.fromName.trim()
  const base = { id: n.id, date: n.date, read: n.read }
  if (n.title) {
    return {
      ...base,
      kind: n.kind,
      emoji: CELEBRATION_EMOJI[n.kind] ?? '🔔',
      text: n.title,
      detail: n.body || undefined,
      target: n.target || undefined,
      pending: n.pending,
    }
  }
  switch (n.kind) {
    case 'friend_request':
      return {
        ...base,
        kind: 'friend_request',
        emoji: '🤝',
        text: who
          ? `${who} seni arkadaş olarak eklemek istiyor`
          : 'Biri seni arkadaş olarak eklemek istiyor',
        requestId: n.requestId,
        fromUserId: n.fromUserId,
      }
    case 'friend_accepted':
      return {
        ...base,
        kind: 'friend_accepted',
        emoji: '🎉',
        text: who
          ? `${who} arkadaşlık isteğini kabul etti`
          : 'Arkadaşlık isteğin kabul edildi',
        fromUserId: n.fromUserId,
      }
    case 'group_invite':
      /* The group's name arrives in `body`, which the server otherwise uses
         for a celebration's second line: a social item has no title, so the
         column is free and the name has to travel somehow. */
      return {
        ...base,
        kind: 'group_invite',
        emoji: '🍲',
        text: who
          ? `${who} seni ${n.body || 'sofrasına'} sofrasına çağırdı`
          : 'Bir sofraya davet edildin',
        requestId: n.requestId,
        fromUserId: n.fromUserId,
      }
    case 'group_invite_accepted':
      return {
        ...base,
        kind: 'group_invite_accepted',
        emoji: '🎉',
        text: who ? `${who} sofrana katıldı` : 'Davetin kabul edildi',
        fromUserId: n.fromUserId,
      }
    case 'greeting':
      return {
        ...base,
        kind: 'greeting',
        emoji: '🧡',
        text: `${who || 'Bir sofra arkadaşın'} afiyet olsun dedi`,
      }
    default:
      /* A kind this build has never heard of, with no words of its own. There
         is nothing honest to draw, and guessing a sentence for it would put
         words in the server's mouth. */
      return null
  }
}

/** Sunucudan listeyi tazele (zil mount olunca ve sheet açılınca). */
export async function refreshNotifications(): Promise<void> {
  const generation = storeGeneration
  try {
    const { items } = await requireApi().notifications()
    if (generation !== storeGeneration) return
    state.items = items.map(present).filter((n): n is AppNotification => n !== null)
    emit()
  } catch {
    // çevrimdışı / giriş yok: son bilinen liste korunur
  }
}

/** Clears notifications and invalidates responses started by the previous session. */
export function clearNotifications(): void {
  storeGeneration += 1
  state.items = []
  emit()
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

/**
 * Tek kalemi okundu işaretle (kaleme dokununca).
 *
 * Optimistik: nokta hemen söner, istek arkada gider. Kaybolursa kalem bir
 * sonraki tazelemede okunmamışa döner, yani en kötü ihtimalle kişi bir kez
 * daha dokunur. Zaten okunmuş kaleme dokunmak istek üretmez.
 */
export function markRead(id: string) {
  const item = state.items.find((n) => n.id === id)
  if (!item || item.read) return
  /* Bekleyen kalemde işaret yine YAZILIR ama yerelde okunmuş gösterilmez:
     sunucu sebebi kapanana kadar okundu saymıyor, kalemi "Yeni"den çıkarmak
     bir sonraki tazelemede geri getirirdi. İşaretin yazılması, ödül alındığı
     anda kalemin ikinci bir dokunuş beklemeden yerine oturmasını sağlar. */
  if (!item.pending) {
    state.items = state.items.map((n) => (n.id === id ? { ...n, read: true } : n))
    emit()
  }
  try {
    requireApi()
      .readNotification(id)
      .catch(() => {
        // İşaret sunucuya yazılamadı: bir sonraki tazelemede tekrar denenir.
      })
  } catch {
    // giriş yok: yerel işaret yeterli
  }
}

/**
 * "Hepsini okundu say": tek istekte imleci ileri çeker.
 *
 * Sebebi açık olan kalemler bundan da etkilenmez; sunucu onları okundu
 * saymadığı için bir sonraki tazelemede yine "Yeni"de olurlar, o yüzden
 * yerelde de oldukları gibi bırakılırlar.
 */
export function markAllRead() {
  const unread = state.items.some((n) => !n.read)
  if (!unread) return
  state.items = state.items.map((n) => (n.read || n.pending ? n : { ...n, read: true }))
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
