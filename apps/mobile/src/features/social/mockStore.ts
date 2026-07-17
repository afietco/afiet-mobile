import { useSyncExternalStore } from 'react'
import type { Friend, FriendRequest, FriendStatus, PublicGroup, SocialProfile } from './types'

/**
 * Sosyal katman MOCK deposu, notifications.ts'deki useSyncExternalStore
 * modül-store desenini birebir izler. TÜM veri bellek içi ve sabittir
 * (Date.now / Math.random YOK, id'ler index tabanlı: 'u1', 'r1', 'g1'…).
 *
 * MOCK: backend gelince bu dosyanın yerini gerçek API repository'si alacak;
 * hook imzaları ve eylem sözleşmesi aynı kalacak ki ekranlar değişmesin.
 * Eylemler optimistik: mock olduğundan durum anında güncellenir (greetings.ts
 * jest desenindeki gibi, ama sunucu doğrulaması olmadan).
 */

/** Aktif (bu cihazdaki) kullanıcının sabit kimliği. */
const MY_USER_ID = 'me'

/** Profillerin tek kaynağı, arananabilir havuz da, arkadaşlar da buradan türer. */
interface PoolUser {
  userId: string
  username: string
  displayName: string
  emoji: string | null
  energyRatio: number
  afiyetToday: boolean
  afiyetWeeks: number
  groupName: string | null
  sex?: 'male' | 'female'
  heightCm?: number
  activityLevel?: string
}

/** friend_accepted bildirimi için sabit "kabul edildi" olayı (bkz. notifications.ts). */
export interface SocialAcceptedEvent {
  id: string
  userId: string
  username: string
  displayName: string
  /** Yerel gün (YYYY-MM-DD). */
  createdAt: string
}

/* ── Sabit mock veri ─────────────────────────────────────────────────────────
   Türkçe isimler, afiet tonunda. Arananabilir ~10 kişilik havuz; içinden
   5 arkadaş, 2 gelen istek, 1 giden istek ve 2 yabancı (henüz ilişkisiz). */

const POOL: PoolUser[] = [
  { userId: 'me', username: '', displayName: 'Sen', emoji: '🙂', energyRatio: 0.82, afiyetToday: true, afiyetWeeks: 6, groupName: 'Akşam Sofrası' },
  { userId: 'u1', username: 'zeynep_k', displayName: 'Zeynep', emoji: '🌻', energyRatio: 0.94, afiyetToday: true, afiyetWeeks: 12, groupName: 'Akşam Sofrası', sex: 'female', heightCm: 164, activityLevel: 'orta' },
  { userId: 'u2', username: 'mert.aydin', displayName: 'Mert', emoji: '🚵', energyRatio: 0.71, afiyetToday: true, afiyetWeeks: 8, groupName: 'Hafif Adımlar', sex: 'male', heightCm: 178, activityLevel: 'yüksek' },
  { userId: 'u3', username: 'elif', displayName: 'Elif', emoji: '🍇', energyRatio: 0.58, afiyetToday: false, afiyetWeeks: 4, groupName: null, sex: 'female', heightCm: 160, activityLevel: 'hafif' },
  { userId: 'u4', username: 'can_yilmaz', displayName: 'Can', emoji: '🐿️', energyRatio: 1.12, afiyetToday: true, afiyetWeeks: 9, groupName: 'Denge Kulübü', sex: 'male', heightCm: 182, activityLevel: 'orta' },
  { userId: 'u5', username: 'selin.k', displayName: 'Selin', emoji: '🌿', energyRatio: 0.66, afiyetToday: true, afiyetWeeks: 15, groupName: 'Akşam Sofrası', sex: 'female', heightCm: 168, activityLevel: 'orta' },
  { userId: 'u6', username: 'deniz', displayName: 'Deniz', emoji: '🌊', energyRatio: 0.44, afiyetToday: false, afiyetWeeks: 2, groupName: null, sex: 'female', heightCm: 171, activityLevel: 'hafif' },
  { userId: 'u7', username: 'burak_t', displayName: 'Burak', emoji: '⛰️', energyRatio: 0.88, afiyetToday: true, afiyetWeeks: 5, groupName: 'Hafif Adımlar', sex: 'male', heightCm: 175, activityLevel: 'yüksek' },
  { userId: 'u8', username: 'ayse.n', displayName: 'Ayşe', emoji: '🫖', energyRatio: 0.79, afiyetToday: true, afiyetWeeks: 7, groupName: null, sex: 'female', heightCm: 162, activityLevel: 'orta' },
  { userId: 'u9', username: 'kaan', displayName: 'Kaan', emoji: '🎧', energyRatio: 0.51, afiyetToday: false, afiyetWeeks: 1, groupName: null, sex: 'male', heightCm: 180, activityLevel: 'hafif' },
  { userId: 'u10', username: 'ece_g', displayName: 'Ece', emoji: '📚', energyRatio: 0.97, afiyetToday: true, afiyetWeeks: 11, groupName: 'Denge Kulübü', sex: 'female', heightCm: 166, activityLevel: 'orta' },
]

/** Değişebilir çekirdek durum, eylemler bunu günceller, emit() türevleri yeniler. */
interface State {
  myUsername: string | null
  friendIds: Set<string>
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  publicGroups: PublicGroup[]
  joinedGroupIds: Set<string>
  acceptedEvents: SocialAcceptedEvent[]
}

const state: State = {
  // MOCK: başta belirlenmemiş, kullanıcı adı seçme akışı bunu doldurur.
  myUsername: null,
  friendIds: new Set(['u1', 'u2', 'u3', 'u4', 'u5']),
  incoming: [
    { id: 'r1', direction: 'incoming', userId: 'u6', username: 'deniz', displayName: 'Deniz', emoji: '🌊', createdAt: '2026-07-17' },
    { id: 'r2', direction: 'incoming', userId: 'u7', username: 'burak_t', displayName: 'Burak', emoji: '⛰️', createdAt: '2026-07-16' },
  ],
  outgoing: [
    { id: 'r3', direction: 'outgoing', userId: 'u8', username: 'ayse.n', displayName: 'Ayşe', emoji: '🫖', createdAt: '2026-07-15' },
  ],
  publicGroups: [
    { id: 'g1', name: 'Akşam Sofrası', emoji: '🍲', memberCount: 12 },
    { id: 'g2', name: 'Hafif Adımlar', emoji: '🥗', memberCount: 8 },
    { id: 'g3', name: 'Sabah Kaçamağı', emoji: '☕', memberCount: 5 },
    { id: 'g4', name: 'Denge Kulübü', emoji: '⚖️', memberCount: 21 },
  ],
  joinedGroupIds: new Set(),
  // MOCK: geçmişte gönderdiğim isteğin kabul edildiği sabit olay (friend_accepted).
  acceptedEvents: [
    { id: 'a1', userId: 'u5', username: 'selin.k', displayName: 'Selin', createdAt: '2026-07-16' },
  ],
}

/* ── Reaktif snapshot ────────────────────────────────────────────────────────
   Hook'lar snapshot dilimlerini döner; getSnapshot referansları emit'ler
   arasında sabit kalmalı (yoksa sonsuz render). Bu yüzden türevler (friends,
   requests, profileById) yalnız emit()'te bir kez kurulur. */

interface Snapshot {
  myUsername: string | null
  friends: Friend[]
  requests: { incoming: FriendRequest[]; outgoing: FriendRequest[] }
  publicGroups: PublicGroup[]
  profileById: Map<string, SocialProfile>
}

function statusFor(userId: string): FriendStatus {
  if (userId === MY_USER_ID) return 'self'
  if (state.friendIds.has(userId)) return 'friends'
  if (state.outgoing.some((r) => r.userId === userId)) return 'outgoing'
  if (state.incoming.some((r) => r.userId === userId)) return 'incoming'
  return 'none'
}

function toProfile(u: PoolUser): SocialProfile {
  return {
    userId: u.userId,
    username: u.username,
    displayName: u.displayName,
    emoji: u.emoji,
    energyRatio: u.energyRatio,
    afiyetToday: u.afiyetToday,
    afiyetWeeks: u.afiyetWeeks,
    groupName: u.groupName,
    sex: u.sex,
    heightCm: u.heightCm,
    activityLevel: u.activityLevel,
    friendStatus: statusFor(u.userId),
  }
}

function build(): Snapshot {
  const profileById = new Map<string, SocialProfile>()
  for (const u of POOL) {
    // Kendi kullanıcı adım güncellendiyse profilime yansısın.
    const merged = u.userId === MY_USER_ID ? { ...u, username: state.myUsername ?? '' } : u
    profileById.set(u.userId, toProfile(merged))
  }
  const friends: Friend[] = POOL.filter((u) => state.friendIds.has(u.userId)).map((u) => ({
    userId: u.userId,
    username: u.username,
    displayName: u.displayName,
    emoji: u.emoji,
    energyRatio: u.energyRatio,
    afiyetToday: u.afiyetToday,
  }))
  return {
    myUsername: state.myUsername,
    friends,
    requests: { incoming: [...state.incoming], outgoing: [...state.outgoing] },
    publicGroups: [...state.publicGroups],
    profileById,
  }
}

let snapshot: Snapshot = build()

const listeners = new Set<() => void>()

function emit() {
  snapshot = build()
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** notifications.ts sosyal değişiklikleri dinlesin diye dışa açılan abonelik. */
export function subscribeSocialChange(l: () => void): () => void {
  return subscribe(l)
}

/* ── Hook'lar (reaktif okuma) ────────────────────────────────────────────── */

/** Benim kullanıcı adım, belirlenmemişse null. */
export function useMyUsername(): string | null {
  return useSyncExternalStore(subscribe, () => snapshot.myUsername)
}

/** Arkadaş listem. */
export function useFriends(): Friend[] {
  return useSyncExternalStore(subscribe, () => snapshot.friends)
}

/** Bekleyen istekler (gelen + giden). */
export function useFriendRequests(): { incoming: FriendRequest[]; outgoing: FriendRequest[] } {
  return useSyncExternalStore(subscribe, () => snapshot.requests)
}

/** Herkese açık grup keşfi. */
export function usePublicGroups(): PublicGroup[] {
  return useSyncExternalStore(subscribe, () => snapshot.publicGroups)
}

/** Tek bir kişinin herkese açık profili (arkadaşlık durumuyla). Yoksa null. */
export function useSocialProfile(userId: string): SocialProfile | null {
  return useSyncExternalStore(subscribe, () => snapshot.profileById.get(userId) ?? null)
}

/* ── Reaktif olmayan okuyucular (notifications.ts köprüsü) ────────────────── */

/** Gelen istekler, bildirim listesi türetmek için anlık okuma. */
export function getIncomingRequests(): FriendRequest[] {
  return snapshot.requests.incoming
}

/** "Kabul edildi" olayları, friend_accepted bildirimi türetmek için. */
export function getAcceptedEvents(): SocialAcceptedEvent[] {
  return state.acceptedEvents
}

/** Bir gruba katıldım mı (optimistik). */
export function isJoinedGroup(id: string): boolean {
  return state.joinedGroupIds.has(id)
}

/* ── Eylemler (optimistik; mock olduğundan anında state günceller) ────────── */

/** Kullanıcı adı format kuralı: 3-20 karakter, küçük harf, a-z0-9_ ve nokta. */
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/

/**
 * Kullanıcı adı uygun mu, format geçerli VE havuzdaki adlarla çakışmıyor.
 * MOCK: backend gelince gerçek benzersizlik sorgusuyla değişecek.
 */
export function isUsernameAvailable(u: string): boolean {
  const v = u.trim().toLowerCase()
  if (!USERNAME_RE.test(v)) return false
  if (v === state.myUsername) return true
  return !POOL.some((p) => p.userId !== MY_USER_ID && p.username.toLowerCase() === v)
}

/** Kullanıcı adımı belirle/değiştir. MOCK: yalnız yerel state, doğrulama yok. */
export function setUsername(u: string) {
  state.myUsername = u.trim().toLowerCase()
  emit()
}

/**
 * Kullanıcı ara, username ya da görünen ad sorguyu içeriyorsa döner (kendim
 * hariç). MOCK: backend gelince sunucu araması ile değişecek.
 */
export function searchUsers(query: string): SocialProfile[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out: SocialProfile[] = []
  for (const u of POOL) {
    if (u.userId === MY_USER_ID) continue
    if (u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q)) {
      const p = snapshot.profileById.get(u.userId)
      if (p) out.push(p)
    }
  }
  return out
}

/** Arkadaşlık isteği gönder, gidene ekle, hedefin durumu 'outgoing' olur. */
export function sendFriendRequest(userId: string) {
  if (userId === MY_USER_ID) return
  if (state.friendIds.has(userId)) return
  if (state.outgoing.some((r) => r.userId === userId)) return
  const u = POOL.find((p) => p.userId === userId)
  if (!u) return
  // Karşı taraf zaten bana istek attıysa, göndermek yerine kabul et (çift onay).
  const incoming = state.incoming.find((r) => r.userId === userId)
  if (incoming) {
    acceptRequest(incoming.id)
    return
  }
  state.outgoing = [
    ...state.outgoing,
    {
      // MOCK: sabit türev id (Date.now yok), kullanıcı başına tek giden istek.
      id: `o-${userId}`,
      direction: 'outgoing',
      userId: u.userId,
      username: u.username,
      displayName: u.displayName,
      emoji: u.emoji,
      createdAt: '2026-07-17',
    },
  ]
  emit()
}

/** Gelen isteği kabul et, arkadaşa çevir, istekten düş. */
export function acceptRequest(id: string) {
  const req = state.incoming.find((r) => r.id === id)
  if (!req) return
  state.incoming = state.incoming.filter((r) => r.id !== id)
  state.friendIds = new Set(state.friendIds).add(req.userId)
  emit()
}

/** Gelen isteği reddet, sessizce düş. */
export function declineRequest(id: string) {
  if (!state.incoming.some((r) => r.id === id)) return
  state.incoming = state.incoming.filter((r) => r.id !== id)
  emit()
}

/** Gönderdiğim isteği geri çek. */
export function cancelRequest(id: string) {
  if (!state.outgoing.some((r) => r.id === id)) return
  state.outgoing = state.outgoing.filter((r) => r.id !== id)
  emit()
}

/** Herkese açık gruba katıl, optimistik üye sayısı artışı. */
export function joinPublicGroup(id: string) {
  if (state.joinedGroupIds.has(id)) return
  state.joinedGroupIds = new Set(state.joinedGroupIds).add(id)
  state.publicGroups = state.publicGroups.map((g) =>
    g.id === id ? { ...g, memberCount: g.memberCount + 1 } : g,
  )
  emit()
}
