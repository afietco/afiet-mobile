import { todayISO } from '@afiet/core'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import {
  ApiError,
  type ApiFriend,
  type ApiFriendRequest,
  type ApiPublicGroup,
  type ApiSocialProfile,
  type ApiGroupView,
} from '@/data/api/client'
import { notify } from '@/data/live'
import { useLiveValue } from '@/data/useLive'
import { refreshNotifications } from '@/features/notifications/notifications'
import type { Friend, FriendRequest, FriendStatus, PublicGroup, SocialProfile } from './types'

/**
 * Sosyal katman deposu, gerçek backend (arkadaşlık, kullanıcı adı, herkese açık
 * grup keşfi, başkasının profili). notifications.ts / greetings.ts ile aynı
 * modül-store desenini izler: mutable `state`, dilim referansları yalnız
 * değişince yeni nesneye döner (useSyncExternalStore stabilitesi), her değişimde
 * emit().
 *
 * Listeler (arkadaşlar, istekler, keşif) sakin yükleme durumu taşır; hook mount
 * olunca tazelenir. Eylemler (istek gönder/kabul/ret/geri al) greetings.ts
 * desenindeki gibi OPTİMİSTİK: dokunulur dokunulmaz UI güncellenir, arkada API
 * çağrılır, hata olursa geri alınır. Arkadaşlık durumu (friendStatus) canlı
 * dilimlerden + optimistik "overlay"den türetilir ki buton durumu arama,
 * profil kartı ve arkadaşlar ekranında tutarlı ve anında güncellensin.
 */

export type LoadStatus = 'loading' | 'error' | 'ready'

export interface FriendsView {
  status: LoadStatus
  friends: Friend[]
  message: string
}

export interface RequestsView {
  status: LoadStatus
  incoming: FriendRequest[]
  outgoing: FriendRequest[]
  message: string
}

/* ── Modül durumu ─────────────────────────────────────────────────────────── */

interface State {
  friends: FriendsView
  requests: RequestsView
  publicGroups: PublicGroup[]
  /** Optimistik arkadaşlık durumu (userId → status); eylem anında set edilir. */
  overlay: Map<string, FriendStatus>
}

const state: State = {
  friends: { status: 'loading', friends: [], message: '' },
  requests: { status: 'loading', incoming: [], outgoing: [], message: '' },
  publicGroups: [],
  overlay: new Map(),
}

let version = 0
const listeners = new Set<() => void>()
let storeGeneration = 0

function emit() {
  version += 1
  for (const l of listeners) l()
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/**
 * Herhangi bir depo değişiminde yeniden render (durum türetimini tazelemek için).
 * applyStatus çağıran bileşenler (arama sonuçları, profil kartı) bunu kullanır ki
 * optimistik overlay değişimleri butonlara anında yansısın.
 */
export function useStoreTick(): number {
  return useSyncExternalStore(subscribe, () => version)
}

/* ── Api → domain eşlemeleri (camelCase; null → boş/varsayılan) ────────────── */

function toFriend(u: ApiFriend): Friend {
  return {
    userId: u.userId,
    username: u.username ?? '',
    displayName: u.displayName ?? '',
    emoji: u.emoji,
    energyRatio: u.energyRatio ?? 0,
    afiyetToday: u.afiyetToday ?? false,
  }
}

function toReq(r: ApiFriendRequest): FriendRequest {
  return {
    id: r.id,
    direction: r.direction,
    userId: r.userId,
    username: r.username ?? '',
    displayName: r.displayName ?? '',
    emoji: r.emoji,
    createdAt: r.createdAt,
  }
}

function toPublicGroup(g: ApiPublicGroup): PublicGroup {
  return { id: g.id, name: g.name, emoji: g.emoji, memberCount: g.memberCount }
}

function toSocialProfile(p: ApiSocialProfile): SocialProfile {
  return {
    userId: p.userId,
    username: p.username ?? '',
    displayName: p.displayName ?? '',
    emoji: p.emoji,
    energyRatio: p.energyRatio ?? 0,
    afiyetToday: p.afiyetToday ?? false,
    afiyetWeeks: p.afiyetWeeks,
    groupName: p.groupName,
    sex: p.sex === 'male' || p.sex === 'female' ? p.sex : undefined,
    heightCm: p.heightCm ?? undefined,
    activityLevel: p.activityLevel ?? undefined,
    friendStatus: p.friendStatus,
  }
}

/** Liste yükleme hatasını sakin Türkçe metne çevir (varsa backend mesajı). */
function friendlyList(e: unknown): string {
  if (e instanceof ApiError && e.message && !/^HTTP \d+$/.test(e.message)) return e.message
  return 'Şu an yüklenemedi, birazdan tekrar dene.'
}

/* ── Durum türetimi (canlı dilimler + overlay) ────────────────────────────── */

function statusFor(userId: string, fallback: FriendStatus): FriendStatus {
  const o = state.overlay.get(userId)
  if (o) return o
  if (state.friends.friends.some((f) => f.userId === userId)) return 'friends'
  if (state.requests.outgoing.some((r) => r.userId === userId)) return 'outgoing'
  if (state.requests.incoming.some((r) => r.userId === userId)) return 'incoming'
  return fallback
}

/**
 * Bir profilin arkadaşlık durumunu canlı depoyla harmanla. Arama sonuçları ve
 * profil kartı bunu render sırasında çağırır; depoya abone bileşende (bkz.
 * useStoreTick / useFriendRequests) optimistik değişimler anında yansır.
 */
export function applyStatus(p: SocialProfile): SocialProfile {
  if (p.friendStatus === 'self') return p
  const s = statusFor(p.userId, p.friendStatus)
  return s === p.friendStatus ? p : { ...p, friendStatus: s }
}

function setOverlay(userId: string, s: FriendStatus) {
  const next = new Map(state.overlay)
  next.set(userId, s)
  state.overlay = next
  emit()
}

function clearOverlay(userId: string) {
  if (!state.overlay.has(userId)) return
  const next = new Map(state.overlay)
  next.delete(userId)
  state.overlay = next
  emit()
}

/* ── Yükleyiciler (eşzamanlı çağrılar tek uçuşta birleşir) ─────────────────── */

let friendsFlight: string | null = null
let loadedFriendsDate: string | null = null

async function loadFriends(date: string): Promise<void> {
  if (friendsFlight === date) return
  const generation = storeGeneration
  friendsFlight = date
  loadedFriendsDate = date
  if (state.friends.status !== 'ready') {
    state.friends = { status: 'loading', friends: state.friends.friends, message: '' }
    emit()
  }
  try {
    const { friends } = await requireApi().listFriends(date)
    if (generation !== storeGeneration) return
    state.friends = { status: 'ready', friends: friends.map(toFriend), message: '' }
  } catch (e) {
    if (generation !== storeGeneration) return
    state.friends = { status: 'error', friends: [], message: friendlyList(e) }
  } finally {
    if (generation === storeGeneration) friendsFlight = null
  }
  if (generation === storeGeneration) emit()
}

function refreshFriends() {
  if (loadedFriendsDate) void loadFriends(loadedFriendsDate)
}

/** Arkadaş listesini yeniden çek (hata ekranındaki "tekrar dene"). */
export function reloadFriends(date: string): void {
  void loadFriends(date)
}

let requestsFlight: Promise<void> | null = null

function loadRequests(): Promise<void> {
  if (requestsFlight) return requestsFlight
  const generation = storeGeneration
  requestsFlight = (async () => {
    if (state.requests.status !== 'ready') {
      state.requests = { ...state.requests, status: 'loading', message: '' }
      emit()
    }
    try {
      const r = await requireApi().listFriendRequests()
      if (generation !== storeGeneration) return
      state.requests = {
        status: 'ready',
        incoming: r.incoming.map(toReq),
        outgoing: r.outgoing.map(toReq),
        message: '',
      }
    } catch (e) {
      if (generation !== storeGeneration) return
      state.requests = { status: 'error', incoming: [], outgoing: [], message: friendlyList(e) }
    } finally {
      if (generation === storeGeneration) requestsFlight = null
    }
    if (generation === storeGeneration) emit()
  })()
  return requestsFlight
}

let groupsFlight: Promise<void> | null = null

function loadPublicGroups(): Promise<void> {
  if (groupsFlight) return groupsFlight
  const generation = storeGeneration
  groupsFlight = (async () => {
    try {
      const { groups } = await requireApi().discoverGroups()
      if (generation !== storeGeneration) return
      state.publicGroups = groups.map(toPublicGroup)
    } catch {
      if (generation !== storeGeneration) return
      // Keşif isteğe bağlı bir bölüm; erişilemezse sessizce boş kalır (gizlenir).
      state.publicGroups = []
    } finally {
      if (generation === storeGeneration) groupsFlight = null
    }
    if (generation === storeGeneration) emit()
  })()
  return groupsFlight
}

/** Clears social data and invalidates responses started by the previous session. */
export function resetSocialStore(): void {
  storeGeneration += 1
  friendsFlight = null
  loadedFriendsDate = null
  requestsFlight = null
  groupsFlight = null
  state.friends = { status: 'loading', friends: [], message: '' }
  state.requests = { status: 'loading', incoming: [], outgoing: [], message: '' }
  state.publicGroups = []
  state.overlay = new Map()
  emit()
}

/* ── Hook'lar (reaktif okuma + mount'ta tazeleme) ──────────────────────────── */

/**
 * Benim kullanıcı adım (backend profilinden); belirlenmemişse null. Profil
 * tablosuna bağlıdır: setUsername sonrası notify('profiles') ile tazelenir.
 */
export function useMyUsername(): string | null {
  const v = useLiveValue(
    ['profiles'],
    async () => {
      try {
        return (await requireApi().getProfile()).username ?? null
      } catch {
        return null
      }
    },
    [],
  )
  return v ?? null
}

/** Arkadaş listem (date verilince enerji halkası + bugün afiyette dolar). */
export function useFriends(date: string): FriendsView {
  useEffect(() => {
    void loadFriends(date)
  }, [date])
  return useSyncExternalStore(subscribe, () => state.friends)
}

/** Bekleyen istekler (gelen + giden). */
export function useFriendRequests(): RequestsView {
  useEffect(() => {
    void loadRequests()
  }, [])
  return useSyncExternalStore(subscribe, () => state.requests)
}

/** Herkese açık grup keşfi (grubu olana boş liste). */
export function usePublicGroups(): PublicGroup[] {
  useEffect(() => {
    void loadPublicGroups()
  }, [])
  return useSyncExternalStore(subscribe, () => state.publicGroups)
}

/**
 * Tek bir kişinin herkese açık profili (getPublicProfile). userId değişince
 * çeker; depoya abone olduğundan istek gönder/kabul sonrası buton durumu anında
 * güncellenir. loading = ilk çekiliş sürüyor (kart sakin bekler).
 */
export function useSocialProfile(userId: string): {
  profile: SocialProfile | null
  loading: boolean
} {
  const [loaded, setLoaded] = useState<{ userId: string; profile: SocialProfile | null } | null>(
    null,
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoaded(null)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    requireApi()
      .getPublicProfile(userId, todayISO())
      .then((p) => {
        if (alive) {
          setLoaded({ userId, profile: toSocialProfile(p) })
          setLoading(false)
        }
      })
      .catch(() => {
        if (alive) {
          setLoaded({ userId, profile: null })
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [userId])

  // Overlay/istek değişimlerinde durum türetimini tazele.
  useStoreTick()

  const base = loaded && loaded.userId === userId ? loaded.profile : null
  return { profile: base ? applyStatus(base) : null, loading: loading && !base }
}

/* ── Kullanıcı adı ─────────────────────────────────────────────────────────── */

/** Kullanıcı adı format kuralı: 3-20 karakter, küçük harf, a-z0-9_ ve nokta. */
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/

/**
 * Kullanıcı adı biçimi geçerli mi (canlı UI kapısı). Benzersizlik sunucuda
 * denetlenir: setUsername PUT'u alınmış adda 409 döner, çağıran "alınmış" gösterir.
 */
export function isUsernameAvailable(u: string): boolean {
  return USERNAME_RE.test(u.trim().toLowerCase())
}

/**
 * Kullanıcı adımı belirle/değiştir. Geçersiz biçim→400, alınmış→409 ile
 * ApiError fırlatır (çağıran sheet yakalayıp sakin metne çevirir). Başarıda
 * profil tablosunu tazeler (@handle profil ekranında güncellenir).
 */
export async function setUsername(u: string): Promise<void> {
  await requireApi().updateProfile({ username: u.trim().toLowerCase() })
  notify('profiles')
}

/* ── Arama ─────────────────────────────────────────────────────────────────── */

/** Kullanıcı ara (sunucu araması). q < 2 → boş liste. */
export async function searchUsers(q: string): Promise<SocialProfile[]> {
  const query = q.trim()
  if (query.length < 2) return []
  const { results } = await requireApi().searchUsers(query)
  return results.map(toSocialProfile)
}

/* ── Eylemler (optimistik; arka planda API + hata geri alma) ───────────────── */

/** Arkadaşlık isteği gönder. Karşı taraf zaten bana istek attıysa sunucu
    doğrudan arkadaş yapar (friendStatus: 'friends'), ona göre yansıtırız. */
export function sendFriendRequest(userId: string): void {
  if (!userId) return
  const generation = storeGeneration
  setOverlay(userId, 'outgoing')
  void (async () => {
    try {
      const r = await requireApi().sendFriendRequest({ addresseeId: userId })
      if (generation !== storeGeneration) return
      await loadRequests()
      if (generation !== storeGeneration) return
      if (r.friendStatus === 'friends') {
        setOverlay(userId, 'friends')
        refreshFriends()
      } else {
        // Giden dilimi artık isteği taşır; overlay'e gerek kalmadı.
        clearOverlay(userId)
      }
      void refreshNotifications()
    } catch {
      if (generation !== storeGeneration) return
      clearOverlay(userId)
    }
  })()
}

/** Gelen isteği kabul et (arkadaşa çevir). */
export function acceptRequest(id: string): void {
  const generation = storeGeneration
  const req = state.requests.incoming.find((r) => r.id === id)
  if (req) {
    const overlay = new Map(state.overlay)
    overlay.set(req.userId, 'friends')
    state.overlay = overlay
    state.requests = {
      ...state.requests,
      incoming: state.requests.incoming.filter((r) => r.id !== id),
    }
    emit()
  }
  void (async () => {
    try {
      await requireApi().acceptFriendRequest(id)
      if (generation !== storeGeneration) return
      await loadRequests()
      if (generation !== storeGeneration) return
      refreshFriends()
      void refreshNotifications()
    } catch {
      if (generation !== storeGeneration) return
      if (req) clearOverlay(req.userId)
      void loadRequests()
    }
  })()
}

/** Gelen isteği reddet. */
export function declineRequest(id: string): void {
  const generation = storeGeneration
  const had = state.requests.incoming.some((r) => r.id === id)
  if (had) {
    state.requests = {
      ...state.requests,
      incoming: state.requests.incoming.filter((r) => r.id !== id),
    }
    emit()
  }
  void (async () => {
    try {
      await requireApi().declineFriendRequest(id)
      if (generation !== storeGeneration) return
      await loadRequests()
      if (generation !== storeGeneration) return
      void refreshNotifications()
    } catch {
      if (generation !== storeGeneration) return
      void loadRequests()
    }
  })()
}

/** Gönderdiğim isteği geri çek. */
export function cancelRequest(id: string): void {
  const generation = storeGeneration
  const req = state.requests.outgoing.find((r) => r.id === id)
  if (req) {
    const overlay = new Map(state.overlay)
    overlay.set(req.userId, 'none')
    state.overlay = overlay
    state.requests = {
      ...state.requests,
      outgoing: state.requests.outgoing.filter((r) => r.id !== id),
    }
    emit()
  }
  void (async () => {
    try {
      await requireApi().cancelFriendRequest(id)
      if (generation !== storeGeneration) return
      await loadRequests()
      if (generation !== storeGeneration) return
      void refreshNotifications()
    } catch {
      if (generation !== storeGeneration) return
      if (req) clearOverlay(req.userId)
      void loadRequests()
    }
  })()
}

/**
 * Herkese açık gruba katıl. Dönen tam görünümü çağırana verir (Grubum ekranı
 * useGroups'u tazeler, grup sayfada belirir). Gizli→403, yok→404, zaten
 * grupta→409 ApiError fırlatır (çağıran sakin metne çevirir).
 */
export function joinPublicGroup(groupId: string): Promise<ApiGroupView> {
  return requireApi().joinPublicGroup(groupId)
}
