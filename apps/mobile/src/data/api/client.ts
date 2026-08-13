/**
 * Backend (afiet-api) tipli istemcisi. Endpoint gövdeleri camelCase, backend
 * JSON'uyla birebir. Kimlik, verilen authedFetch üzerinden taşınır (token
 * enjeksiyonu + 401'de yenileme AuthContext'te). Bu tipler backend modeliyle
 * eşleşir; @afiet/core'un yerel (numeric id) tiplerinden AYRIDIR, köprü
 * repository katmanında yapılır (Aşama 2).
 */

import type { KeseAllowance } from '@afiet/core'
import { invalidationTargets } from './invalidation'
import { createRequestCache, type RequestCacheOptions } from './requestCache'

export interface ApiProfile {
  userId: string
  email: string
  displayName: string | null
  emoji: string | null
  /** Kalıcı 8 karakterli arkadaş kodu (sunucu üretir, değişmez). Eski bir
      backend alanı henüz döndürmüyorsa null olabilir. */
  friendCode: string | null
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

/** Sofradaki tek besin; öğün kaydına yazılan biçimin aynısı. */
export interface ApiSofraFood {
  name: string
  groups: string[]
  measure: string | null
  quantity: number
}

/**
 * Sofra: birlikte yenen besinlerin kaydı (GET /v1/sofras).
 *
 * `meals` sofranın KENDİ alanı, içindeki besinlerin uygunluklarının kesişimi
 * değil: yoğurt her öğüne yakışır, "akşam sofram" yakışmaz. Boş dizi
 * "her öğün" demektir.
 */
export interface ApiSofra {
  id: string
  name: string
  meals: string[]
  foods: ApiSofraFood[]
  createdAt: string
  updatedAt: string
}

export type ApiSofraInput = Pick<ApiSofra, 'name' | 'meals' | 'foods'>

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
  /** Ömür boyu birikimden gelen seviye; liste sunucuda buna göre SIRALI gelir
      (istemci yeniden sıralamaz). Kaydı olmayan üye 1 döner. */
  level: number
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

/** GET /v1/league/history, kapanmış mevsimler (Profil > Mevsimlerin).
    Akıbet (terfi/düşme) BİLEREK gelmez: raf nötr bir arşiv, inişleri
    işaretleyen bir raf başarısızlık kaydı olurdu. */
export interface ApiLeagueHistory {
  seasons: { seasonStart: string; tier: string }[]
}

/** GET /v1/summary/range, gün gün besin değerleri (Bilgilerim > Değerler).
    Aralıktaki HER gün döner; kaydı olmayan günde knownCount+unknownCount = 0
    olur ve istemci onu sıfır gün değil, boşluk sayar. */
export interface ApiNutritionRange {
  from: string
  to: string
  days: {
    date: string
    kcal: number
    protein: number
    carb: number
    fat: number
    knownCount: number
    unknownCount: number
    balanceScore: number
    waterGlasses: number
    /** Öğün başına enerji; kaydı olmayan öğün sıfırla DOLDURULMAZ, hiç gelmez. */
    mealKcal: Record<string, number> | null
  }[]
  targets: {
    energyKcal: number
    protein: number
    carb: number
    fat: number
    waterGlasses: number
    fiberG: number
  }
}

/** GET /v1/summary/week/history, geçmiş haftaların dökümü (Profil). */
export interface ApiRhythmHistory {
  weeks: { weekStart: string; days: boolean[]; done: number; won: boolean }[]
  totalWeeks: number
}

/** GET /v1/progress yanıtı: seviye, unvan ve seviye içi ilerleme.
    Eğri sunucuyla aynıdır (@afiet/core progress.ts ↔ internal/progress). */
export interface ApiProgress {
  level: number
  title: string
  totalXp: number
  xpIntoLevel: number
  xpForLevel: number
  xpToNext: number
  ratio: number
  /** Sonraki unvana kalan seviye; zirvede 0. */
  levelsToNextTitle: number
}

/** GET /v1/quests öğesi. İlerleme sunucuda mevcut veriden TÜRETİLİR;
    istemci sayaç tutmaz, yalnız okur ve tamamlananı alır (docs/12). */
export interface ApiQuest {
  key: string
  title: string
  detail: string
  /**
   * Afi'nin görevi anlattığı uzun metin; görev detayında okunur.
   *
   * Opsiyonel, çünkü alan sunucuda `detail`den sonra eklendi: anlatımı henüz
   * olmayan bir sunucu ya da doldurulmamış bir görev tanımı için istemci
   * `detail`e düşer.
   */
  narration?: string
  emoji: string
  target: number
  progress: number
  xpReward: number
  /** Metrik ailesi; görünürlük kuralı bununla gruplanır (aynı metriğin eşikleri). */
  group: string
  completed: boolean
  claimed: boolean
}

/**
 * GET /v1/kese: the weekly ikram kesesi (afiet-gamification/docs/13).
 *
 * The server computes the whole thing and keeps no balance: the allowance is
 * derived on every read from the tier, the title band and this week's mutual
 * greetings, and `spent` is the messages that actually went out. The client
 * displays it and never does the arithmetic itself.
 *
 * `enabled` false means the feature is asleep server-side (KESE_ENABLED):
 * nothing is metered, and every surface hides the kese rather than showing a
 * zero that would read as an empty one.
 */
export interface ApiKese {
  enabled: boolean
  allowance: KeseAllowance
  spent: number
  remaining: number
  empty: boolean
  /** Monday this allowance belongs to (YYYY-MM-DD). */
  weekStart: string
  /** Next Monday 00:00 Europe/Istanbul, RFC3339; the countdown reads this. */
  refreshesAt: string
  tier: string
  level: number
  premium: boolean
}

export interface ApiLeagueRow {
  userId: string
  displayName: string
  emoji: string | null
  level: number
  /** O ay kazanılan tecrübe. */
  score: number
  rank: number
  isMe: boolean
}

/** GET /v1/league yanıtı. seated=false ise kullanıcı henüz bir mevsime
    dahil değil (ya da lig kapalı); istemci tanıtım hâlini gösterir. */
export interface ApiLeague {
  seated: boolean
  seasonStart: string
  seasonEnd: string
  tier: string
  rows: ApiLeagueRow[]
  myRank: number
  myScore: number
  /** Ay sonunda kaç kişinin yükseleceği/ineceği; zeminde/zirvede 0. */
  promote: number
  demote: number
  outcome: 'promote' | 'stay' | 'demote' | null
  /** Bu ayki puanın kaynak kaynak dökümü; sıfır satır gelmez. `count` ile
      `amount` birbirinden TÜRETİLMEZ, ikisi de defterden sayılır. */
  myBreakdown: { source: string; amount: number; count: number }[]
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

/** Cümleden okunan tek besin (POST /v1/afi/besin-ayikla). */
export interface ApiSentenceFood extends ApiAfiPhotoFood {
  quantity: number
  /** Miktarı cümle mi söyledi. false ise değer bizim varsayılanımız. */
  amountKnown: boolean
}

export interface ApiSentenceReading {
  foods: ApiSentenceFood[]
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

/**
 * GET /v1/notifications item.
 *
 * The bell is the primary channel: social events come from their own tables and
 * celebrations come from the push proposals, whether or not the gate let a push
 * out. Reminders are deliberately absent - a poke that missed its moment is not
 * something to keep.
 *
 * Celebration kinds carry their own title and body, written and editable on the
 * server; social kinds carry a name instead, because the app builds those
 * sentences itself.
 */
export type ApiNotificationKind =
  | 'greeting'
  | 'friend_request'
  | 'friend_accepted'
  | 'week_closure'
  | 'week_summary'
  | 'streak_3'
  | 'first_measurement'
  | 'meal_10'
  | 'first_custom_food'
  | 'quest_reward'

export interface ApiNotification {
  id: string
  /** Unknown kinds are possible: the server may learn a kind before this build does. */
  kind: ApiNotificationKind | (string & {})
  /** Gönderenin görünen adı; boş olabilir. */
  fromName: string
  /** friend_request: kabul/ret için ilgili arkadaşlık isteği id'si. */
  requestId?: string
  /** friend_request | friend_accepted: ilgili kullanıcının id'si. */
  fromUserId?: string
  /** Kalemin yerel günü (YYYY-MM-DD). */
  date: string
  createdAt: string
  /** Kalem işaretiyle eski imlecin birleşimi. */
  read: boolean
  /** Kutlamalar: sunucuda yazılan başlık. */
  title?: string
  /** Kutlamalar: sunucuda yazılan gövde. */
  body?: string
  /** Dokununca gidilecek yer (push ile aynı hedef). */
  target?: string
}

export interface ApiPushDeviceInput {
  installationId: string
  expoPushToken: string
  platform: 'ios' | 'android'
  timezone: string
  appVersion: string
}

export interface ApiPushPreferences {
  mealReminderEnabled: boolean
  mealReminderTime: string
  weekClosureEnabled: boolean
  socialEnabled: boolean
  announcementsEnabled: boolean
  /** The first-week steps and the way back. Its own switch because a new
      member is never reminded but is deliberately invited: filing the two
      together would let somebody mute the guidance they most need. */
  invitationsEnabled: boolean
  timezone: string
}

export type ApiPushPreferencesPatch = Partial<
  Pick<
    ApiPushPreferences,
    | 'mealReminderEnabled'
    | 'mealReminderTime'
    | 'weekClosureEnabled'
    | 'socialEnabled'
    | 'announcementsEnabled'
    | 'invitationsEnabled'
  >
>

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
// Arkadaş kodu, arkadaşlık (çift onaylı), herkese açık grup keşfi ve başkasının
// herkese açık profili. Tümü camelCase; friendStatus görüntüleyenin bakışından.
export type ApiFriendStatus = 'self' | 'none' | 'outgoing' | 'incoming' | 'friends'

/** Shared user-search and public-profile response contract. */
export interface ApiSocialProfile {
  userId: string
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
  displayName: string | null
  emoji: string | null
  energyRatio: number | null
  afiyetToday: boolean | null
}

/** Bekleyen arkadaşlık isteği (gelen ya da giden). */
export interface ApiFriendRequest {
  id: string
  userId: string
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

  /* GET goes through the read cache. A mutation runs raw, then invalidates the
     reads it actually affects; the notify() that follows therefore refetches
     only what moved instead of everything. An endpoint with no rule falls back
     to invalidating everything, so a new one is stale-free by default. */
  async function req<T>(path: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    const method = (init?.method ?? 'GET').toUpperCase()
    if (method === 'GET') return cache.dedupe(path, () => rawReq<T>(path, init, timeoutMs))
    const result = await rawReq<T>(path, init, timeoutMs)
    const targets = invalidationTargets(path)
    if (targets === null) cache.invalidateAll()
    else cache.invalidatePrefixes(targets)
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

    upsertPushDevice: (input: ApiPushDeviceInput) =>
      req<void>('/v1/push/devices/current', {
        ...json(input),
        method: 'PUT',
      }),
    deletePushDevice: (installationId: string) =>
      req<void>('/v1/push/devices/current', {
        ...json({ installationId }),
        method: 'DELETE',
      }),
    /** Records that a notification was tapped. The id comes from the payload;
        the server ignores a repeat for the same event, so a retry is free. */
    markPushOpened: (eventId: string) =>
      req<void>('/v1/push/opened', { ...json({ eventId }), method: 'POST' }),
    getPushPreferences: () => req<ApiPushPreferences>('/v1/push/preferences'),
    updatePushPreferences: (patch: ApiPushPreferencesPatch) =>
      req<ApiPushPreferences>('/v1/push/preferences', {
        ...json(patch),
        method: 'PATCH',
      }),

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

    // Sofralar; Menüm'de kurulur, besin eklerken öğüne göre süzülüp önerilir.
    listSofras: () => req<ApiSofra[]>('/v1/sofras'),
    addSofra: (input: ApiSofraInput) => req<ApiSofra>('/v1/sofras', json(input)),
    updateSofra: (id: string, input: ApiSofraInput) =>
      req<ApiSofra>(`/v1/sofras/${id}`, { ...json(input), method: 'PUT' }),
    deleteSofra: (id: string) => req<void>(`/v1/sofras/${id}`, { method: 'DELETE' }),

    // Gruplar, TEK GRUP modeli; katılım kalıcı grup koduyla. Kişi-başı
    // modelde kullanıcı JWT'den gelir; tam görünüm uçları (create/get/join/
    // update) aynı ApiGroupView gövdesini döner. Kullanıcı zaten bir
    // gruptayken kur/katıl 409 döner.
    /** isPublic verilmezse sunucu gizli kabul eder (group_handlers.go). */
    createGroup: (name: string, emoji: string | null, isPublic = false) =>
      req<ApiGroupView>('/v1/groups', json({ name, emoji, isPublic })),
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
    /** Afi: kişinin ne yediğini anlattığı cümleden ayrı besinleri okur.
        Kota tek besinlik öneriyle paylaşılır; dolunca 429, sağlayıcı
        hatasında 502 döner. */
    afiSentence: (text: string, signal?: AbortSignal) =>
      req<ApiSentenceReading>(
        '/v1/afi/besin-ayikla',
        { ...json({ text }), signal },
        AI_PHOTO_REQUEST_TIMEOUT_MS,
      ),
    /** Destek sohbeti için açık rızayı sunucuya yazar. Cihazdaki bayrak
        rızanın KANITI değildir (yeniden kurulumda kaybolur), o yüzden ekran
        ancak bu başarılı olunca açılır. */
    acceptChatConsent: (assistant: string) =>
      req<{ consentKey: string; textVersion: string }>('/v1/chat/consent', json({ assistant })),
    /** Rızayı geri çeker. Geri çekmek bir hak, o yüzden destek talebi değil uç. */
    revokeChatConsent: () => req<void>('/v1/chat/consent', { method: 'DELETE' }),
    /** Sohbeti sunucudan siler. Olmayan sohbeti silmek hata değildir: istemci
        yereli zaten sildi ve kopan bağlantıdan sonraki tekrar deneme başarısız
        görünmemeli. */
    deleteChatSession: (sessionId: string) =>
      req<void>(`/v1/chat/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),

    /** Bildirim merkezi listesi (yeniden eskiye, en fazla 50). */
    notifications: () => req<{ items: ApiNotification[] }>('/v1/notifications'),
    /** Tüm bildirimleri okundu işaretle ("hepsini okundu say"). */
    ackNotifications: () => req<void>('/v1/notifications/ack', json({})),
    /** Tek kalemi okundu işaretle (kaleme dokununca). Tekrarı hata değildir. */
    readNotification: (id: string) =>
      req<void>(`/v1/notifications/${encodeURIComponent(id)}/read`, json({})),
    /** Kişisel afiyet ritmi haftası (Bugün'deki şerit). */
    summaryWeek: (date: string) =>
      req<ApiRhythmWeek>(`/v1/summary/week?date=${encodeURIComponent(date)}`),
    /** Hafta kapanışı: kutlanacak hafta (varsa) + toplam afiyet haftası. */
    weekClosure: (date: string) =>
      req<ApiWeekClosure>(`/v1/summary/week/closure?date=${encodeURIComponent(date)}`),
    /** Kutlamanın gösterildiğini işaretler (bir kez konfeti). */
    ackWeekClosure: (weekStart: string) =>
      req<void>('/v1/summary/week/closure/ack', json({ weekStart })),
    /** Kapanmış mevsimlerin listesi; en yeni başta. */
    leagueHistory: () => req<ApiLeagueHistory>('/v1/league/history'),
    /** Gün gün besin değerleri; aralık en fazla 92 gün. */
    nutritionRange: (from: string, to: string) =>
      req<ApiNutritionRange>(
        `/v1/summary/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    /** Geçmiş haftaların ritim dökümü + toplam afiyet haftası (Profil). */
    rhythmHistory: (date: string) =>
      req<ApiRhythmHistory>(`/v1/summary/week/history?date=${encodeURIComponent(date)}`),

    // ── Oyunlaştırma: seviye ve lig ──────────────────────────────────────────
    /** Seviye, unvan ve seviye içi ilerleme. Bayrak kapalıyken sıfır döner. */
    getProgress: () => req<ApiProgress>('/v1/progress'),
    /** Bu ayki lig masam ve canlı sıralama. */
    getLeague: () => req<ApiLeague>('/v1/league'),
    /** Bu haftaki ikram kesem. Bayrak kapalıyken enabled=false döner. */
    getKese: () => req<ApiKese>('/v1/kese'),
    /** Aktif görevler + türetilmiş ilerlemem. Bayrak kapalıysa boş liste. */
    getQuests: () => req<ApiQuest[]>('/v1/quests'),
    /** Tamamlanmış görevi alır; ödül görevin TAMAMLANDIĞI güne yazılır. */
    claimQuest: (key: string) =>
      req<ApiQuest>(`/v1/quests/${encodeURIComponent(key)}/claim`, json({})),

    /** Behavior telemetry (batched). Bypasses req() on purpose: telemetry
        writes nothing the app reads back, and flushes are frequent enough
        that the mutation-path invalidateAll would keep the read cache cold. */
    sendEvents: (events: { name: string; props?: Record<string, unknown> }[]) =>
      rawReq<void>('/v1/events', json({ events })),

    // ── Sosyal katman ────────────────────────────────────────────────────────
    /** Kullanıcı ara (görünen adla). q < 2 → sunucu boş liste döner. */
    searchUsers: (q: string) =>
      req<{ results: ApiSocialProfile[] }>(`/v1/users/search?q=${encodeURIComponent(q)}`),
    /** Arkadaş koduyla kişi bul. Kod yoksa 404. */
    getUserByCode: (code: string) =>
      req<ApiSocialProfile>(`/v1/users/by-code/${encodeURIComponent(code)}`),
    /** Arkadaşlık isteği gönder. Kendine→400, hedef yok→404. */
    sendFriendRequest: (body: { addresseeId: string }) =>
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
