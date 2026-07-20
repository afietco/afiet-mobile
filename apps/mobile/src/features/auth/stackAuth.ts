/**
 * Stack Auth REST istemcisi; publishable key gerekmiyor (proje ayarı),
 * client erişim tipiyle doğrudan çağrılır. Backend yalnızca JWT'yi JWKS ile
 * doğrular; token üretimi burada, istemcide olur.
 */
import { config } from '@/config'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  userId: string
}

/** GET /users/me'den ekranların ihtiyaç duyduğu sade alt küme. */
export interface StackUser {
  primaryEmail: string | null
  primaryEmailVerified: boolean
  displayName: string | null
  /** Kullanıcının şifresi var mı? Apple (OAuth) ile gelen kullanıcıda false;
      hesap ekranı bu durumda "şifre belirle" akışını gösterir. Yanıtta alan
      hiç yoksa true varsayılır ki mevcut şifreli kullanıcılar yanlışlıkla
      "şifre belirle" görmesin. */
  hasPassword: boolean
}

/** Access token süresi dolmuş/geçersiz (401). Çağıran BİR kez yenileyip tekrar
    deneyebilir; refresh token'ın kendisi geçersizse ayrıca InvalidRefreshTokenError
    yükselir (bkz. refreshAccessToken). */
export class StackUnauthorizedError extends Error {}

/** afiet.co'daki auth callback sayfaları. Stack Auth maildeki bağlantıya
    ?code=... parametresini KENDİSİ ekler; uygulama URL'ye query eklemez.
    Ortam eki (dev | staging | prod) sayfanın doğru Stack projesiyle
    konuşmasını sağlar (eşleme: config.env). */
const passwordResetCallbackUrl = `https://afiet.co/sifre-yenile/${config.env}`
const emailVerifyCallbackUrl = `https://afiet.co/e-posta-dogrula/${config.env}`

/** Content-Type BURADA YOK; Stack Auth, gövdesiz istekte bile Content-Type
    application/json görürse gövdeyi parse etmeye kalkıp 400 BODY_PARSING_ERROR
    döner. JSON gönderen çağrı başlığı kendisi ekler (ve gövdeyi boş bırakmaz). */
function stackHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Stack-Access-Type': 'client',
    'X-Stack-Project-Id': config.stackProjectId,
  }
  // Publishable key opsiyonel: doluysa eklenir, boşken başlık hiç gönderilmez
  // (mevcut anahtarsız davranış birebir korunur).
  if (config.stackPublishableClientKey) {
    headers['X-Stack-Publishable-Client-Key'] = config.stackPublishableClientKey
  }
  return headers
}

// Stack Auth hata gövdesi: { code, error, details }. Kullanıcıya okunur mesaj.
// Ham `error` alanı ASLA gösterilmez; e-posta gibi kişisel veri içeriyor ve İngilizce.
// Gövdeyi kendisi okuyan çağrılar (bkz. sendVerificationEmail) ve googleSignIn'in
// OAuth hata işleyicisi haritayı readError yerine doğrudan bu fonksiyonla paylaşır.
export function stackErrorMessage(body: { code?: string; error?: string }): string {
  if (body.code === 'EMAIL_PASSWORD_MISMATCH') return 'E-posta veya şifre hatalı.'
  if (
    body.code === 'USER_EMAIL_ALREADY_EXISTS' ||
    body.code === 'CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE'
  )
    return 'Bu e-posta zaten kayıtlı. Giriş yapmayı dene.'
  if (body.code === 'PASSWORD_TOO_SHORT') return 'Şifre en az 8 karakter olmalı.'
  if (body.code === 'PASSWORD_CONFIRMATION_MISMATCH') return 'Mevcut şifren hatalı.'
  // Eşlenmemiş/dokümante olmayan kod adları sahada teşhis edilebilsin diye
  // loglanır (yalnız kod; ham `error` kişisel veri içerir, asla loglanmaz).
  // Kullanıcı her koşulda aşağıdaki genel Türkçe mesajı görür.
  if (body.code) console.warn(`[stackAuth] eşlenmemiş hata kodu: ${body.code}`)
  return 'Bir şeyler ters gitti.'
}

async function readError(res: Response): Promise<string> {
  return stackErrorMessage(await readErrorBody(res))
}

async function readErrorBody(res: Response): Promise<{ code?: string; error?: string }> {
  try {
    const body = await res.json()
    return typeof body === 'object' && body !== null
      ? (body as { code?: string; error?: string })
      : {}
  } catch {
    return {}
  }
}

async function authRequest(path: string, body: unknown): Promise<AuthTokens> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/${path}`, {
    method: 'POST',
    headers: { ...stackHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    user_id: string
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user_id,
  }
}

export function signUp(email: string, password: string): Promise<AuthTokens> {
  // verification_callback_url: yeni kayda doğrulama maili otomatik gitsin;
  // maildeki bağlantı afiet.co'daki doğrulama sayfasına düşer.
  return authRequest('password/sign-up', {
    email,
    password,
    verification_callback_url: emailVerifyCallbackUrl,
  })
}

function backendStackKeyHeader(): Record<string, string> {
  return config.stackPublishableClientKey
    ? { 'X-Stack-Publishable-Client-Key': config.stackPublishableClientKey }
    : {}
}

async function readBackendError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } }
    return body.error?.message?.trim() || 'Bir şeyler ters gitti.'
  } catch {
    return 'Bir şeyler ters gitti.'
  }
}

/** Stack accepts email credentials only; the Afiet backend resolves handles
    without exposing their private email address to the client. */
export async function signIn(identifier: string, password: string): Promise<AuthTokens> {
  const normalized = identifier.trim().toLowerCase()
  if (normalized.includes('@')) return authRequest('password/sign-in', { email: normalized, password })

  const res = await fetch(`${config.apiUrl}/auth/password/sign-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...backendStackKeyHeader(),
    },
    body: JSON.stringify({ identifier: normalized, password }),
  })
  if (!res.ok) throw new Error(await readBackendError(res))
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    user_id: string
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user_id,
  }
}

/**
 * Apple ile giriş: cihazda alınan Apple identityToken'ı Stack Auth'un native
 * token exchange ucuna verir; Stack token'ı Apple JWKS'i ve dashboard'daki
 * Bundle ID audience'ıyla doğrulayıp kendi oturum token'larını döndürür.
 * Kullanıcı yoksa oluşturulur (is_new_user true döner; çağıran ilk girişte
 * display name yazmak için kullanır; Stack, Apple'ın verdiği adı saklamaz).
 * Girişsiz uçtur; 401 için özel ele alma gerekmez. Uç hatası (ör. provider
 * dashboard'da tanımlı değilse) genel mesaja düşerse Apple'a özel sakin
 * metne çevrilir; kod adı uydurulmaz, yalnız genel mesaj özelleştirilir.
 */
export async function signInWithAppleToken(
  idToken: string,
): Promise<AuthTokens & { isNewUser: boolean }> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/oauth/callback/apple/native`, {
    method: 'POST',
    headers: { ...stackHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  })
  if (!res.ok) {
    const message = await readError(res)
    throw new Error(
      message === 'Bir şeyler ters gitti.'
        ? 'Apple ile giriş şu anda kullanılamıyor. E-postanla giriş yapabilirsin.'
        : message,
    )
  }
  const data = (await res.json()) as {
    access_token: string
    refresh_token: string
    user_id: string
    is_new_user: boolean
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    userId: data.user_id,
    isNewUser: Boolean(data.is_new_user),
  }
}

/**
 * Şifre sıfırlama bağlantısı gönderir; access token GEREKMEZ (girişsiz akış).
 * Stack Auth kullanıcı-enumerasyonuna karşı e-posta kayıtlı olmasa da 200 döner;
 * çağıran başarıyı "gönderildi" sayar. Gövdeli POST olduğundan Content-Type
 * eklenir (dosya başı notu). Uç hatasında (ör. callback alan adı dashboard'da
 * henüz güvenilir değilse) readError'daki genel Türkçe mesaja düşülür.
 */
export async function sendPasswordResetCode(identifier: string): Promise<void> {
  const normalized = identifier.trim().toLowerCase()
  if (!normalized.includes('@')) {
    const res = await fetch(`${config.apiUrl}/auth/password/send-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...backendStackKeyHeader(),
      },
      body: JSON.stringify({ identifier: normalized }),
    })
    if (!res.ok) throw new Error(await readBackendError(res))
    return
  }

  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/password/send-reset-code`, {
    method: 'POST',
    headers: { ...stackHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalized, callback_url: passwordResetCallbackUrl }),
  })
  if (!res.ok) throw new Error(await readError(res))
}

/** Public availability check used before creating an external auth identity.
    A 404/405 means an older backend is still deployed; the authenticated PUT
    remains the final source of truth. */
export async function isRegistrationUsernameAvailable(username: string): Promise<boolean> {
  const res = await fetch(
    `${config.apiUrl}/auth/username-available?username=${encodeURIComponent(username)}`,
  )
  if (res.status === 404 || res.status === 405) return true
  if (!res.ok) throw new Error(await readBackendError(res))
  const data = (await res.json()) as { available?: boolean }
  return data.available === true
}

/** Claims the pre-checked username before the session becomes visible to the UI. */
export async function claimRegistrationUsername(
  accessToken: string,
  username: string,
): Promise<void> {
  const res = await fetch(`${config.apiUrl}/v1/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  })
  if (!res.ok) throw new Error(await readBackendError(res))
}

/**
 * Mevcut kullanıcının Stack Auth kimliğini siler. Proje ayarında "client user
 * deletion" AÇIK olmalı; kapalıysa Stack Auth hata döner (çağıran best-effort
 * yakalar). Erişim token'ı gerekir.
 */
export async function deleteCurrentUser(accessToken: string): Promise<void> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/users/me`, {
    method: 'DELETE',
    headers: { ...stackHeaders(), 'X-Stack-Access-Token': accessToken },
  })
  if (!res.ok) throw new Error(await readError(res))
}

/**
 * Giriş yapan kullanıcının Stack Auth profilini okur (GET, gövdesiz → Content-Type
 * yok). Access token süresi dolmuşsa 401'i StackUnauthorizedError olarak yükseltir;
 * çağıran (AuthContext) bir kez yenileyip tekrar dener.
 */
export async function getCurrentUser(accessToken: string): Promise<StackUser> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/users/me`, {
    headers: { ...stackHeaders(), 'X-Stack-Access-Token': accessToken },
  })
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as {
    primary_email: string | null
    primary_email_verified: boolean
    display_name: string | null
    has_password?: boolean
  }
  return {
    primaryEmail: data.primary_email ?? null,
    primaryEmailVerified: Boolean(data.primary_email_verified),
    displayName: data.display_name ?? null,
    // Alan yoksa true varsay (yalnız açıkça false ise şifresiz say); aksi
    // halde şifreli kullanıcılara yanlışlıkla "şifre belirle" gösterilir.
    hasPassword: data.has_password !== false,
  }
}

/**
 * Giriş yapan kullanıcının görünen adını yazar. Apple ilk yetkilendirmede adı
 * yalnız cihaza verir, Stack SAKLAMAZ; ilk girişte istemci buradan yazar.
 * Gövdeli PATCH → Content-Type eklenir. Çağıran (AuthContext) best-effort
 * kullanır: hata girişi engellemez.
 */
export async function updateDisplayName(
  accessToken: string,
  displayName: string,
): Promise<void> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/users/me`, {
    method: 'PATCH',
    headers: {
      ...stackHeaders(),
      'Content-Type': 'application/json',
      'X-Stack-Access-Token': accessToken,
    },
    body: JSON.stringify({ display_name: displayName }),
  })
  if (!res.ok) throw new Error(await readError(res))
}

/** Kullanıcının iletişim kanalı (bugün pratikte tek e-posta kanalı). */
export interface ContactChannel {
  id: string
  type: string
  value: string
  isPrimary: boolean
  isVerified: boolean
  usedForAuth: boolean
}

/** Stack Auth'un snake_case kanal gövdesi; liste elemanı ve tekil kanal yanıtı
    aynı şekildedir, ikisi de toContactChannel ile camelCase'e çevrilir. */
interface RawContactChannel {
  id: string
  type: string
  value: string
  is_primary: boolean
  is_verified: boolean
  used_for_auth: boolean
}

function toContactChannel(c: RawContactChannel): ContactChannel {
  return {
    id: c.id,
    type: c.type,
    value: c.value,
    isPrimary: Boolean(c.is_primary),
    isVerified: Boolean(c.is_verified),
    usedForAuth: Boolean(c.used_for_auth),
  }
}

/**
 * Giriş yapan kullanıcının iletişim kanallarını listeler (doğrulama maili
 * kanal id'siyle gönderildiği için gerekli). Gövdesiz GET → Content-Type yok.
 * Access token süresi dolmuşsa 401'i StackUnauthorizedError olarak yükseltir;
 * çağıran (AuthContext) bir kez yenileyip tekrar dener.
 */
export async function listContactChannels(accessToken: string): Promise<ContactChannel[]> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/contact-channels?user_id=me`, {
    headers: { ...stackHeaders(), 'X-Stack-Access-Token': accessToken },
  })
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { items: RawContactChannel[] }
  return (data.items ?? []).map(toContactChannel)
}

/**
 * E-posta değiştirme akışının ilk adımı: kullanıcıya YENİ bir e-posta kanalı
 * açar. Kanal doğrulanmamış ve girişe kapalı (used_for_auth false) doğar;
 * kullanıcı maildeki bağlantıyla doğruladıktan sonra updateContactChannel ile
 * girişe açılıp birincil yapılır. Gövdeli POST → Content-Type eklenir. Access
 * token süresi dolmuşsa 401'i StackUnauthorizedError olarak yükseltir; çağıran
 * (AuthContext) bir kez yenileyip tekrar dener. Adres başka bir hesabın giriş
 * e-postasıysa Stack CONTACT_CHANNEL_ALREADY_USED_FOR_AUTH_BY_SOMEONE_ELSE
 * döner ve readError bunu okunur Türkçe mesaja çevirir; eşlenmemiş kodlar
 * genel mesaja düşer (stackErrorMessage loglar).
 */
export async function createEmailChannel(
  accessToken: string,
  email: string,
): Promise<ContactChannel> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/contact-channels`, {
    method: 'POST',
    headers: {
      ...stackHeaders(),
      'Content-Type': 'application/json',
      'X-Stack-Access-Token': accessToken,
    },
    body: JSON.stringify({ user_id: 'me', type: 'email', value: email, used_for_auth: false }),
  })
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (!res.ok) throw new Error(await readError(res))
  return toContactChannel((await res.json()) as RawContactChannel)
}

/**
 * İletişim kanalını günceller; e-posta değişiminde doğrulanmış yeni kanalı
 * girişe açıp (used_for_auth) birincil (is_primary) yapmak için kullanılır.
 * Gövdeye YALNIZ verilen alanlar yazılır. Gövdeli PATCH → Content-Type
 * eklenir. Access token süresi dolmuşsa 401'i StackUnauthorizedError olarak
 * yükseltir; çağıran (AuthContext) bir kez yenileyip tekrar dener.
 */
export async function updateContactChannel(
  accessToken: string,
  channelId: string,
  patch: { usedForAuth?: boolean; isPrimary?: boolean },
): Promise<void> {
  const body: Record<string, boolean> = {}
  if (patch.usedForAuth !== undefined) body.used_for_auth = patch.usedForAuth
  if (patch.isPrimary !== undefined) body.is_primary = patch.isPrimary
  const res = await fetch(`${config.stackBaseUrl}/api/v1/contact-channels/me/${channelId}`, {
    method: 'PATCH',
    headers: {
      ...stackHeaders(),
      'Content-Type': 'application/json',
      'X-Stack-Access-Token': accessToken,
    },
    body: JSON.stringify(body),
  })
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (!res.ok) throw new Error(await readError(res))
}

/**
 * Deletes a contact channel during email replacement or cancellation. A
 * missing channel is treated as an idempotent success, while authentication
 * and transient failures remain retryable by the caller.
 */
export async function deleteContactChannel(
  accessToken: string,
  channelId: string,
): Promise<void> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/contact-channels/me/${channelId}`, {
    method: 'DELETE',
    headers: { ...stackHeaders(), 'X-Stack-Access-Token': accessToken },
  })
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (res.status === 404) return
  if (!res.ok) throw new Error(await readError(res))
}

/**
 * Verilen iletişim kanalına (e-posta) doğrulama maili gönderir. Gövdeli POST →
 * Content-Type eklenir. Access token süresi dolmuşsa 401'i StackUnauthorizedError
 * olarak yükseltir; çağıran (AuthContext) bir kez yenileyip tekrar dener.
 * EMAIL_ALREADY_VERIFIED özel durumdur ve hata SAYILMAZ: sessizce döner, çağıran
 * rozeti tazeleyince kullanıcı "Doğrulanmış"ı görür. Bu yüzden gövde burada bir
 * kez okunur ve diğer kodlar readError'ın haritasıyla (stackErrorMessage) okunur
 * Türkçe mesaja çevrilir.
 */
export async function sendVerificationEmail(
  accessToken: string,
  channelId: string,
): Promise<void> {
  const res = await fetch(
    `${config.stackBaseUrl}/api/v1/contact-channels/me/${channelId}/send-verification-code`,
    {
      method: 'POST',
      headers: {
        ...stackHeaders(),
        'Content-Type': 'application/json',
        'X-Stack-Access-Token': accessToken,
      },
      body: JSON.stringify({ callback_url: emailVerifyCallbackUrl }),
    },
  )
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (res.ok) return
  let body: { code?: string; error?: string } = {}
  try {
    body = (await res.json()) as { code?: string; error?: string }
  } catch {
    // gövde okunamadı, genel mesaja düşülür
  }
  if (body.code === 'EMAIL_ALREADY_VERIFIED') return
  throw new Error(stackErrorMessage(body))
}

/**
 * Giriş yapan kullanıcının şifresini değiştirir. Access + refresh token gerekir.
 * Gövdeli POST olduğundan Content-Type application/json eklenir ve gövde asla boş
 * bırakılmaz (dosya başı notu). Stack Auth bu uçta başarıyla birlikte kullanıcının
 * DİĞER tüm refresh token'larını iptal eder; X-Stack-Refresh-Token ile bu oturumun
 * refresh token'ı gönderildiği için mevcut cihaz oturumda kalır (header unutulursa
 * kullanıcı kendi cihazında da düşer). Access token süresi dolmuşsa 401'i
 * StackUnauthorizedError olarak yükseltir; çağıran (AuthContext) bir kez yenileyip
 * tekrar dener. Yanlış mevcut şifre 400 PASSWORD_CONFIRMATION_MISMATCH döner ve
 * readError'da okunur Türkçe mesaja çevrilir.
 */
export async function updatePassword(
  accessToken: string,
  refreshToken: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/password/update`, {
    method: 'POST',
    headers: {
      ...stackHeaders(),
      'Content-Type': 'application/json',
      'X-Stack-Access-Token': accessToken,
      'X-Stack-Refresh-Token': refreshToken,
    },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  })
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (!res.ok) throw new Error(await readError(res))
}

/**
 * OAuth (Apple) ile gelmiş, henüz şifresi OLMAYAN kullanıcıya şifre belirler.
 * Kullanıcının şifresi zaten varsa Stack hata döner (bu akış update'in yerine
 * geçmez; ekran hasPassword=false iken gösterir). Gövdeli POST → Content-Type
 * eklenir. Access token süresi dolmuşsa 401'i StackUnauthorizedError olarak
 * yükseltir; çağıran (AuthContext) bir kez yenileyip tekrar dener. Şifre
 * belirlemede diğer oturumlar iptal EDİLMEZ (update'ten farkı).
 */
export async function setPassword(accessToken: string, password: string): Promise<void> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/password/set`, {
    method: 'POST',
    headers: {
      ...stackHeaders(),
      'Content-Type': 'application/json',
      'X-Stack-Access-Token': accessToken,
    },
    body: JSON.stringify({ password }),
  })
  if (res.status === 401) throw new StackUnauthorizedError(await readError(res))
  if (!res.ok) throw new Error(await readError(res))
}

/**
 * Sunucu tarafında mevcut oturumu iptal eder (best-effort çıkış). Hem access hem
 * refresh token gerekir. Gövdesiz DELETE → Content-Type yok. Çağıran (signOut)
 * hatayı yutar; yerel token temizliği bu çağrının sonucundan bağımsızdır.
 */
export async function revokeCurrentSession(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/sessions/current`, {
    method: 'DELETE',
    headers: {
      ...stackHeaders(),
      'X-Stack-Access-Token': accessToken,
      'X-Stack-Refresh-Token': refreshToken,
    },
  })
  if (!res.ok) throw new Error(await readError(res))
}

/**
 * Access token'ın (JWT) `sub` alanından kullanıcı id'sini çözer. Giriş anında
 * userId zaten AuthTokens'ta gelir; oturum diskten geri yüklenirken (userId ayrı
 * saklanmaz) buradan okunur. Çözülemezse null; çağıran bunu tolere etmeli.
 */
export function userIdFromAccessToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')
    const claims = JSON.parse(atob(padded)) as { sub?: string }
    return claims.sub ?? null
  } catch {
    return null
  }
}

/** The refresh token itself is expired or revoked, so the session has ended. */
export class InvalidRefreshTokenError extends Error {}

const INVALID_REFRESH_TOKEN_CODE = 'REFRESH_TOKEN_NOT_FOUND_OR_EXPIRED'

/**
 * Exchanges the current refresh token for a new access token. Only Stack's
 * explicit expired-or-revoked code ends the session; schema and request
 * errors must remain retryable even when they use the same HTTP status.
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/sessions/current/refresh`, {
    method: 'POST',
    headers: {
      ...stackHeaders(),
      'Content-Type': 'application/json',
      'X-Stack-Refresh-Token': refreshToken,
    },
    body: '{}',
  })
  if (!res.ok) {
    const errorBody = await readErrorBody(res)
    if (errorBody.code === INVALID_REFRESH_TOKEN_CODE) {
      throw new InvalidRefreshTokenError('Oturumunun süresi doldu.')
    }
    throw new Error(stackErrorMessage(errorBody))
  }
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}
