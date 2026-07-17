/**
 * Sosyal katman tipleri, kullanıcı adı, arkadaşlık, herkese açık grup keşfi
 * ve başkasının profilini görüntüleme. Veriler gerçek backend'den gelir
 * (bkz. store.ts + data/api/client.ts); bu tipler API gövdelerinin domain
 * karşılığıdır (Api* → bunlar), UI yalnız bunları görür.
 *
 * Kararlar (sabit):
 *  - kullanıcı adı kullanıcı seçer + benzersiz (@handle), sonradan değişebilir
 *  - arkadaşlık ÇİFT ONAYLI (istek gönderilir, karşı taraf kabul/ret eder)
 *  - profil detayı yalnız arkadaşlara ve grup üyelerine açık
 */

/** Benzersiz @handle (küçük harf, 3-20 karakter, a-z0-9_ ve nokta). */
export type Username = string

/**
 * İki kişi arasındaki arkadaşlık durumu (görüntüleyenin bakışından):
 *  - none: ilişki yok, istek gönderilebilir
 *  - outgoing: ben istek gönderdim, karşı tarafın kabulünü bekliyor
 *  - incoming: karşı taraf bana istek gönderdi, kabul/ret bende
 *  - friends: karşılıklı arkadaşız
 *  - self: bu benim kendi profilim
 */
export type FriendStatus = 'none' | 'outgoing' | 'incoming' | 'friends' | 'self'

/**
 * Başkasının profil kartında gösterilecek herkese açık alt küme. Öğün detayı,
 * kilo gibi mahrem alanlar ASLA burada değildir; yalnız enerji halkası, afiyet
 * ritmi ve (varsa) genel vücut/beslenme bağlamı paylaşılır.
 */
export interface SocialProfile {
  userId: string
  username: string
  displayName: string
  emoji: string | null
  /** Günün enerjisi / hedef (1 = hedef tam). Halka bunu çizer. */
  energyRatio: number
  /** Bugün afiyette miydi (en az bir öğün kaydı). */
  afiyetToday: boolean
  /** Tamamlanan afiyet haftası sayısı (rozet). */
  afiyetWeeks: number
  /** Üye olduğu grubun adı; yoksa null. */
  groupName: string | null
  /** Görüntüleyene açık olan sınırlı vücut/beslenme bağlamı (opsiyonel). */
  sex?: 'male' | 'female'
  heightCm?: number
  activityLevel?: string
  /** Görüntüleyenle arasındaki arkadaşlık durumu, buton bununla belirlenir. */
  friendStatus: FriendStatus
}

/** Arkadaş listesi kalemi, sofra arkadaşlarının hafif özeti. */
export interface Friend {
  userId: string
  username: string
  displayName: string
  emoji: string | null
  energyRatio: number
  afiyetToday: boolean
}

/** Bekleyen arkadaşlık isteği (gelen ya da giden). */
export interface FriendRequest {
  id: string
  direction: 'incoming' | 'outgoing'
  userId: string
  username: string
  displayName: string
  emoji: string | null
  /** İsteğin yerel günü (YYYY-MM-DD). */
  createdAt: string
}

/** Herkese açık grup keşfi kalemi, katılmadan önce görünen özet. */
export interface PublicGroup {
  id: string
  name: string
  emoji: string | null
  memberCount: number
}
