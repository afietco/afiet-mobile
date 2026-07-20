/**
 * Backend (afiet-api) tipli istemcisi. Endpoint gövdeleri camelCase, backend
 * JSON'uyla birebir. Kimlik, verilen authedFetch üzerinden taşınır (token
 * enjeksiyonu + 401'de yenileme AuthContext'te). Bu tipler backend modeliyle
 * eşleşir; @afiet/core'un yerel (numeric id) tiplerinden AYRIDIR, köprü
 * repository katmanında yapılır (Aşama 2).
 */

import { createRequestCache, type RequestCacheOptions } from './requestCache'

export interface ApiProfile {
  userId: string
  email: string
  displayName: string | null
  emoji: string | null
  /** Benzersiz @handle (sosyal katman); belirlenmemişse null. */
  username: string | null
  sex: string | null
  birthDate: string | null
  heightCm: number | null
  activityLevel: string | null
  sports: string[]
  createdAt: string
  updatedAt: string
}

export interface ApiProfileInput {
  displayName?: string
  emoji?: string
  /** @handle belirle/değiştir. nil = değiştirme. Geçersiz biçim→400, alınmış→409. */
  username?: string
  sex?: string
  birthDate?: string
  heightCm?: number
  activityLevel?: string
  sports?: string[]
  /** E-posta değişikliğinin backend kopyasına yansıtılması için (kaynak
      doğruluk Stack Auth'ta). Alanı henüz tanımayan backend yok sayabilir
      ya da reddedebilir; çağıran (AuthContext.finalizeEmailChange) bu yüzden
      best-effort gönderir. */
  email?: string
}

export interface ApiMeal {
  id: string
  entryDate: string
  meal: string
  foodName: string
  quantity: number
  measure: string | null
  groups: string[]
  note: string | null
  createdAt: string
}

export interface ApiMealInput {
  entryDate: string
  meal: string
  foodName: string
  quantity: number
  measure?: string
  groups: string[]
  note?: string
}

export interface ApiWater {
  date: string
  glasses: number
}

export interface ApiMeasurement {
  id: string
  measuredOn: string
  weightKg: number
  waistCm: number | null
  neckCm: number | null
  hipCm: number | null
  createdAt: string
}

export interface ApiMacros {
  kcal: number
  protein: number
  carb: number
  fat: number
}

export interface ApiCustomFood {
  id: string
  name: string
  groups: string[]
  measure: string | null
  macros: ApiMacros | null
  description: string | null
  createdAt: string
  updatedAt: string
}

// Hesaplanmış gün özeti, backend TÜM türev sayıları hesaplar (tek doğruluk
// kaynağı). İstemci bu değerleri gösterir, kendisi hesaplamaz.
export interface ApiSummary {
  date: string
  displayName: string | null
  emoji: string | null
  hasBodyData: boolean
  body: {
    weightKg: number
    bmi: number
    bmiRange: string
    bmr: number
    tdee: number
    bodyFatPercent: number | null
  } | null
  targets: {
    energyKcal: number
    protein: number
    carb: number
    fat: number
    waterGlasses: number
    fiberG: number
  }
  nutrition: {
    kcal: number
    protein: number
    carb: number
    fat: number
    knownCount: number
    unknownCount: number
    balance: {
      covered: string[]
      missing: string[]
      score: number
      sweetCount: number
      fastfoodCount: number
    }
  }
  water: { glasses: number; target: number }
  streak: number
}

// ── Gruplar ─────────────────────────────────────────────────────────────────
// Backend'in diğer uçlarıyla tutarlı camelCase. TEK GRUP modeli: kullanıcı en
// fazla bir grupta bulunur; katılım kalıcı 8 haneli grup koduyla (code).
// Roller: owner (kurucu) | member. Owner ayrılırsa devir backend'de yapılır.
export type GroupRole = 'owner' | 'member'

export interface ApiGroupMember {
  userId: string
  displayName: string | null
  /** Üyenin profil avatarı (emoji); yoksa null. */
  emoji: string | null
  role: GroupRole
  joinedAt: string
  /** Sofra görünürlüğü, kapalıysa enerji/afiyet verileri null döner. */
  sofraVisible: boolean
  /** Günün enerjisi / hedef (1 = hedef tam); date'li GET'te ve üye görünürse dolar. */
  energyRatio: number | null
  /** O gün afiyette miydi (≥1 öğün kaydı); date'li GET'te ve üye görünürse dolar. */
  afiyetToday: boolean | null
  /** Bu üyeye o gün "afiyet olsun" dedim mi; date'li GET'te dolar. */
  greetedToday: boolean | null
}

/** Grubun haftalık ortak tablosu (Pzt→Paz), kişi kırılımı YOK. */
export interface ApiGroupWeek {
  weekStart: string
  /** Gün-gün afiyet günü sayısı (yalnız görünür üyeler). */
  counts: number[]
  total: number
  /** Görünür üye × 5. */
  goal: number
}

/** Tek grubun tam görünümü, create/get/join/patch aynı gövdeyi döner. */
export interface ApiGroupView {
  group: {
    id: string
    name: string
    code: string
    emoji: string | null
    /** true ise grup keşifte (GET /v1/groups/discover) listelenir. */
    isPublic: boolean
    createdAt: string
  }
  /** İsteği yapanın bu gruptaki rolü */
  myRole: GroupRole
  members: ApiGroupMember[]
  /** Yalnız date'li GET'te dolar. */
  week: ApiGroupWeek | null
}

/** GET /v1/summary/week, kişisel afiyet ritmi penceresi (Pzt→Paz). */
export interface ApiRhythmWeek {
  weekStart: string
  days: { date: string; afiyet: boolean }[]
  goal: number
  done: number
}

/** GET /v1/summary/week/closure, kutlanacak hafta kapanışı (varsa) + toplam
    afiyet haftası sayacı. closure null = gösterilecek bir şey yok. */
export interface ApiWeekClosure {
  closure: { weekStart: string; days: boolean[]; done: number; goal: number } | null
  totalWeeks: number
}

/** GET /v1/summary/week/history, geçmiş haftaların dökümü (Profil). */
export interface ApiRhythmHistory {
  weeks: { weekStart: string; days: boolean[]; done: number; won: boolean }[]
  totalWeeks: number
}

/** POST /v1/afi/food-suggest yanıtı, Afi'nin Menüm doldurma önerisi.
    Öneri taslaktır: her alan düzenlenebilir, onaysız kayda geçmez. */
export interface ApiAfiFoodSuggestion {
  groups: string[]
  measure: string
  macros: { kcal: number; protein: number; carb: number; fat: number }
  description?: string
}

/** POST /v1/afi/photo-chat, fotoğraftan besin tanıma sohbetinin bir turu.
    Fotoğraf sunucuda saklanmaz; çok turlu bağlam Foundry'de yaşar. */
export interface ApiAfiPhotoFood {
  name: string
  groups: string[]
  measure: string
  macros: { kcal: number; protein: number; carb: number; fat: number }
  description?: string
  /** Katalogda ya da kullanıcının menüsünde aynı adla besin var mı. */
  inPool: boolean
}

export interface ApiAfiPhotoReply {
  conversationId: string
  kind: 'question' | 'result' | 'not_food'
  text: string
  quickReplies: string[]
  needsPhoto: boolean
  food: ApiAfiPhotoFood | null
  /** Karede görülen ek besinler (en fazla 3). */
  extraFoods: ApiAfiPhotoFood[] | null
}

/** GET /v1/notifications kalemi, bildirim merkezi (zil). Selam (greeting) ve
    sosyal katmanın arkadaşlık bildirimleri (friend_request | friend_accepted)
    aynı listede birikir; push tetikleyicileri geldikçe kind genişler. */
export interface ApiNotification {
  id: string
  kind: 'greeting' | 'friend_request' | 'friend_accepted'
  /** Gönderenin görünen adı; boş olabilir. */
  fromName: string
  /** friend_request: kabul/ret için ilgili arkadaşlık isteği id'si. */
  requestId?: string
  /** friend_request | friend_accepted: ilgili kullanıcının id'si. */
  fromUserId?: string
  /** friend_request | friend_accepted: ilgili kullanıcının @handle'ı. */
  fromUsername?: string
  /** Selamın / isteğin yerel günü (YYYY-MM-DD). */
  date: string
  createdAt: string
  /** Okundu imlecinden türetilir (ack sonrası true). */
  read: boolean
}

/** GET /v1/groups liste kalemi, üye listesi yerine sayısı. */
export interface ApiGroupSummary {
  id: string
  name: string
  code: string
  emoji: string | null
  myRole: GroupRole
  memberCount: number
  createdAt: string
}

// ── Sosyal katman ────────────────────────────────────────────────────────────
// Kullanıcı adı, arkadaşlık (çift onaylı), herkese açık grup keşfi ve başkasının
// herkese açık profili. Tümü camelCase; friendStatus görüntüleyenin bakışından.
export type ApiFriendStatus = 'self' | 'none' | 'outgoing' | 'incoming' | 'friends'

/** Shared user-search and public-profile response contract. */
export interface ApiSocialProfile {
  userId: string
  username: string | null
  displayName: string | null
  emoji: string | null
  afiyetWeeks: number
  groupId: string | null
  groupName: string | null
  friendStatus: ApiFriendStatus
  energyRatio?: number | null
  afiyetToday?: boolean | null
  sex?: string | null
  heightCm?: number | null
  activityLevel?: string | null
}

/** Arkadaş listesi kalemi (date'li GET'te energyRatio + afiyetToday dolu). */
export interface ApiFriend {
  userId: string
  username: string | null
  displayName: string | null
  emoji: string | null
  energyRatio: number | null
  afiyetToday: boolean | null
}

/** Bekleyen arkadaşlık isteği (gelen ya da giden). */
export interface ApiFriendRequest {
  id: string
  userId: string
  username: string | null
  displayName: string | null
  emoji: string | null
  createdAt: string
  direction: 'incoming' | 'outgoing'
}

/** Herkese açık grup keşfi kalemi (grubu olana boş liste döner). */
export interface ApiPublicGroup {
  id: string
  name: string
  emoji: string | null
  memberCount: number
}

/** authedFetch: token'ı ekler, 401'de yeniler ve bir kez tekrar dener. */
export type AuthedFetch = (path: string, init?: RequestInit) => Promise<Response>

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000
const AI_PHOTO_REQUEST_TIMEOUT_MS = 45_000

export interface ApiClientOptions extends RequestCacheOptions {
  /** Maximum duration for standard backend requests. Defaults to 10 seconds. */
  requestTimeoutMs?: number
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export class ApiRequestTimeoutError extends Error {
  readonly code = 'REQUEST_TIMEOUT'

  constructor(public readonly timeoutMs: number) {
    super('Bağlantı zaman aşımına uğradı. Tekrar deneyebilirsin.')
    this.name = 'ApiRequestTimeoutError'
  }
}

export function createApiClient(authedFetch: AuthedFetch, opts: ApiClientOptions = {}) {
  // Okuma birleştirme/önbellek katmanı (bkz. requestCache.ts). Örneğe bağlı →
  // oturum başına izole, giriş/çıkışta yeni istemciyle sıfırlanır.
  const cache = createRequestCache(opts)
  const requestTimeoutMs = opts.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS

  // Every request gets a real AbortController. Caller cancellation is forwarded
  // into the same controller while the timeout guarantees a terminal outcome.
  async function rawReq<T>(
    path: string,
    init?: RequestInit,
    timeoutMs = requestTimeoutMs,
  ): Promise<T> {
    const controller = new AbortController()
    const callerSignal = init?.signal
    let timedOut = false
    const abortFromCaller = () => controller.abort()

    if (callerSignal?.aborted) controller.abort()
    else callerSignal?.addEventListener('abort', abortFromCaller, { once: true })

    let timeout: ReturnType<typeof setTimeout> | null = null
    const timeoutFailure = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        timedOut = true
        controller.abort()
        reject(new ApiRequestTimeoutError(timeoutMs))
      }, timeoutMs)
    })

    try {
      const res = await Promise.race([
        authedFetch(path, { ...init, signal: controller.signal }),
        timeoutFailure,
      ])
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try {
          const body = (await res.json()) as { error?: { message?: string } }
          if (body.error?.message) msg = body.error.message
        } catch {
          // gövde yoksa durum kodu yeterli
        }
        throw new ApiError(res.status, msg)
      }
      if (res.status === 204) return undefined as T
      return (await res.json()) as T
    } catch (error) {
      if (timedOut) throw new ApiRequestTimeoutError(timeoutMs)
      throw error
    } finally {
      if (timeout !== null) clearTimeout(timeout)
      callerSignal?.removeEventListener('abort', abortFromCaller)
    }
  }

  // GET → dedup + kısa TTL önbellek. Mutasyon → ham istek + başarıda tüm okuma
  // önbelleğini geçersiz kıl (ardından gelen notify tetikli tazeleme taze gider).
  async function req<T>(path: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    const method = (init?.method ?? 'GET').toUpperCase()
    if (method === 'GET') return cache.dedupe(path, () => rawReq<T>(path, init, timeoutMs))
    const result = await rawReq<T>(path, init, timeoutMs)
    cache.invalidateAll()
    return result
  }

  const json = (body: unknown): RequestInit => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return {
    getProfile: () => req<ApiProfile>('/v1/profile'),
    createProfile: (input: ApiProfileInput) => req<ApiProfile>('/v1/profile', json(input)),
    updateProfile: (input: ApiProfileInput) =>
      req<ApiProfile>('/v1/profile', { ...json(input), method: 'PUT' }),
    // Hesabı ve tüm kullanıcı verisini kalıcı siler (KVKK/Play "veri silme" hakkı).
    deleteAccount: () => req<void>('/v1/account', { method: 'DELETE' }),

    getSummary: (date: string) =>
      req<ApiSummary>(`/v1/summary?date=${encodeURIComponent(date)}`),

    listMeals: (date: string) => req<ApiMeal[]>(`/v1/meals?date=${encodeURIComponent(date)}`),
    listMealsRange: (from: string, to: string) =>
      req<ApiMeal[]>(`/v1/meals?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    loggedDates: () => req<string[]>('/v1/meals/logged-dates'),
    addMeal: (input: ApiMealInput) => req<ApiMeal>('/v1/meals', json(input)),
    updateMeal: (id: string, input: ApiMealInput) =>
      req<ApiMeal>(`/v1/meals/${id}`, { ...json(input), method: 'PUT' }),
    deleteMeal: (id: string) => req<void>(`/v1/meals/${id}`, { method: 'DELETE' }),

    getWater: (date: string) => req<ApiWater>(`/v1/water?date=${encodeURIComponent(date)}`),
    getWaterRange: (from: string, to: string) =>
      req<ApiWater[]>(`/v1/water?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
    setWater: (date: string, glasses: number) =>
      req<ApiWater>('/v1/water', { ...json({ date, glasses }), method: 'PUT' }),

    listMeasurements: (limit?: number) =>
      req<ApiMeasurement[]>(
        limit === undefined ? '/v1/measurements' : `/v1/measurements?limit=${limit}`,
      ),
    addMeasurement: (input: Omit<ApiMeasurement, 'id' | 'createdAt'>) =>
      req<ApiMeasurement>('/v1/measurements', json(input)),
    deleteMeasurement: (id: string) => req<void>(`/v1/measurements/${id}`, { method: 'DELETE' }),

    listCustomFoods: () => req<ApiCustomFood[]>('/v1/custom-foods'),
    addCustomFood: (input: Omit<ApiCustomFood, 'id' | 'createdAt' | 'updatedAt'>) =>
      req<ApiCustomFood>('/v1/custom-foods', json(input)),
    updateCustomFood: (id: string, input: Omit<ApiCustomFood, 'id' | 'createdAt' | 'updatedAt'>) =>
      req<ApiCustomFood>(`/v1/custom-foods/${id}`, { ...json(input), method: 'PUT' }),
    deleteCustomFood: (id: string) => req<void>(`/v1/custom-foods/${id}`, { method: 'DELETE' }),

    // Gruplar, TEK GRUP modeli; katılım kalıcı grup koduyla. Kişi-başı
    // modelde kullanıcı JWT'den gelir; tam görünüm uçları (create/get/join/
    // update) aynı ApiGroupView gövdesini döner. Kullanıcı zaten bir
    // gruptayken kur/katıl 409 döner.
    createGroup: (name: string, emoji: string | null) =>
      req<ApiGroupView>('/v1/groups', json({ name, emoji })),
    listGroups: () => req<{ groups: ApiGroupSummary[] }>('/v1/groups'),
    /** Üyesi olunmayan grup 404 döner. date verilirse üyeler energyRatio taşır. */
    getGroup: (groupId: string, date?: string) =>
      req<ApiGroupView>(
        `/v1/groups/${encodeURIComponent(groupId)}${date ? `?date=${encodeURIComponent(date)}` : ''}`,
      ),
    joinGroup: (code: string) => req<ApiGroupView>('/v1/groups/join', json({ code })),
    /** Gruptan üye çıkar. Kendi userId'n → ayrılma; owner başkasını çıkarabilir. */
    removeGroupMember: (groupId: string, userId: string) =>
      req<void>(
        `/v1/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      ),
    /** Grubun adını, logosunu ve/veya keşif görünürlüğünü değiştir (owner
        değilsem 403). isPublic true → grup keşifte listelenir. */
    updateGroup: (groupId: string, patch: { name?: string; emoji?: string; isPublic?: boolean }) =>
      req<ApiGroupView>(`/v1/groups/${encodeURIComponent(groupId)}`, {
        ...json(patch),
        method: 'PATCH',
      }),
    /** Grubu kalıcı sil, yalnız owner ve grupta tek başınayken (yoksa 409). */
    deleteGroup: (groupId: string) =>
      req<void>(`/v1/groups/${encodeURIComponent(groupId)}`, { method: 'DELETE' }),
    /** Kendi sofra görünürlüğünü değiştir (enerji halkası + afiyet günleri birlikte). */
    setMyGroupVisibility: (groupId: string, visible: boolean) =>
      req<void>(`/v1/groups/${encodeURIComponent(groupId)}/members/me`, {
        ...json({ sofraVisible: visible }),
        method: 'PATCH',
      }),
    /** "Afiyet olsun" selamı gönder. Alıcı görünür + o gün afiyette değilse
        ya da bugün zaten dendiyse 409 (istemci ikisini de "dedin" sayar). */
    sendGreeting: (groupId: string, toUserId: string, date: string) =>
      req<void>(`/v1/groups/${encodeURIComponent(groupId)}/greetings`, json({ toUserId, date })),
    /** Afi: yemeğin adından grup + ölçü + yaklaşık makro önerisi.
        Kota dolunca 429, sağlayıcı hatasında 502 döner. */
    afiFoodSuggest: (name: string) =>
      req<ApiAfiFoodSuggestion>('/v1/afi/food-suggest', json({ name })),
    /** Afi: fotoğraftan besin tanıma sohbetinin bir turu. hint yalnız ilk
        turda anlamlıdır (Besin Ekle'de yazılmış ad). */
    afiPhotoChat: (
      input: {
        conversationId?: string
        text?: string
        imageBase64?: string
        hint?: string
      },
      signal?: AbortSignal,
    ) =>
      req<ApiAfiPhotoReply>(
        '/v1/afi/photo-chat',
        { ...json(input), signal },
        AI_PHOTO_REQUEST_TIMEOUT_MS,
      ),
    /** Bildirim merkezi listesi (yeniden eskiye, en fazla 50). */
    notifications: () => req<{ items: ApiNotification[] }>('/v1/notifications'),
    /** Tüm bildirimleri okundu işaretle (zil açılınca). */
    ackNotifications: () => req<void>('/v1/notifications/ack', json({})),
    /** Kişisel afiyet ritmi haftası (Bugün'deki şerit). */
    summaryWeek: (date: string) =>
      req<ApiRhythmWeek>(`/v1/summary/week?date=${encodeURIComponent(date)}`),
    /** Hafta kapanışı: kutlanacak hafta (varsa) + toplam afiyet haftası. */
    weekClosure: (date: string) =>
      req<ApiWeekClosure>(`/v1/summary/week/closure?date=${encodeURIComponent(date)}`),
    /** Kutlamanın gösterildiğini işaretler (bir kez konfeti). */
    ackWeekClosure: (weekStart: string) =>
      req<void>('/v1/summary/week/closure/ack', json({ weekStart })),
    /** Geçmiş haftaların ritim dökümü + toplam afiyet haftası (Profil). */
    rhythmHistory: (date: string) =>
      req<ApiRhythmHistory>(`/v1/summary/week/history?date=${encodeURIComponent(date)}`),

    /** Davranış telemetrisi (toplu). Uç Faz B'de açılır; çağıran hatayı yutar. */
    sendEvents: (events: { name: string; props?: Record<string, unknown> }[]) =>
      req<void>('/v1/events', json({ events })),

    // ── Sosyal katman ────────────────────────────────────────────────────────
    /** Kullanıcı ara (username + görünen ad). q < 2 → sunucu boş liste döner. */
    searchUsers: (q: string) =>
      req<{ results: ApiSocialProfile[] }>(`/v1/users/search?q=${encodeURIComponent(q)}`),
    /** Arkadaşlık isteği gönder (addresseeId VEYA username). Kendine→400, hedef yok→404. */
    sendFriendRequest: (body: { addresseeId?: string; username?: string }) =>
      req<{ userId: string; friendStatus: ApiFriendStatus }>('/v1/friends/requests', json(body)),
    /** Arkadaş listesi; date verilirse energyRatio + afiyetToday dolar. */
    listFriends: (date: string) =>
      req<{ friends: ApiFriend[] }>(`/v1/friends?date=${encodeURIComponent(date)}`),
    /** Bekleyen istekler (gelen + giden). */
    listFriendRequests: () =>
      req<{ incoming: ApiFriendRequest[]; outgoing: ApiFriendRequest[] }>('/v1/friends/requests'),
    /** Gelen isteği kabul et. */
    acceptFriendRequest: (id: string) =>
      req<void>(`/v1/friends/requests/${encodeURIComponent(id)}/accept`, { method: 'POST' }),
    /** Gelen isteği reddet. */
    declineFriendRequest: (id: string) =>
      req<void>(`/v1/friends/requests/${encodeURIComponent(id)}/decline`, { method: 'POST' }),
    /** Gönderdiğim isteği geri çek. */
    cancelFriendRequest: (id: string) =>
      req<void>(`/v1/friends/requests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    /** Arkadaşlıktan çıkar. */
    removeFriend: (userId: string) =>
      req<void>(`/v1/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' }),
    /** Herkese açık grup keşfi (grubu olana boş liste). */
    discoverGroups: () => req<{ groups: ApiPublicGroup[] }>('/v1/groups/discover'),
    /** Herkese açık gruba kodsuz katıl. Gizli→403, yok→404, zaten grupta→409. */
    joinPublicGroup: (groupId: string) =>
      req<ApiGroupView>(`/v1/groups/${encodeURIComponent(groupId)}/join`, { method: 'POST' }),
    /** Başkasının herkese açık profili; date verilirse enerji/afiyet bağlamı dolar
        (yalnız arkadaş/grup üyesiyse). */
    getPublicProfile: (userId: string, date: string) =>
      req<ApiSocialProfile>(
        `/v1/users/${encodeURIComponent(userId)}?date=${encodeURIComponent(date)}`,
      ),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
