/**
 * Stack Auth REST istemcisi — publishable key gerekmiyor (proje ayarı),
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
}

/** Access token süresi dolmuş/geçersiz (401). Çağıran BİR kez yenileyip tekrar
    deneyebilir; refresh token'ın kendisi geçersizse ayrıca InvalidRefreshTokenError
    yükselir (bkz. refreshAccessToken). */
export class StackUnauthorizedError extends Error {}

/** Content-Type BURADA YOK — Stack Auth, gövdesiz istekte bile Content-Type
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
// Ham `error` alanı ASLA gösterilmez — e-posta gibi kişisel veri içeriyor ve İngilizce.
async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { code?: string; error?: string }
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
  } catch {
    // gövde okunamadı — genel mesaja düş
  }
  return 'Bir şeyler ters gitti.'
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
  return authRequest('password/sign-up', { email, password })
}

export function signIn(email: string, password: string): Promise<AuthTokens> {
  return authRequest('password/sign-in', { email, password })
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
  }
  return {
    primaryEmail: data.primary_email ?? null,
    primaryEmailVerified: Boolean(data.primary_email_verified),
    displayName: data.display_name ?? null,
  }
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
 * saklanmaz) buradan okunur. Çözülemezse null — çağıran bunu tolere etmeli.
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

/** Refresh token'ın KENDİSİ geçersiz/süresi dolmuş — oturum gerçekten bitti.
    Yalnızca bu hatada oturum kapatılır; geçici hatalar (ağ, 5xx) oturuma dokunmaz. */
export class InvalidRefreshTokenError extends Error {}

/** Refresh token ile yeni access token alır (refresh token değişmez).
    Gövde boş `{}` — gövdesiz POST Stack Auth'ta 400 BODY_PARSING_ERROR olur
    ve bu, her açılışta oturum düşmesi olarak yaşanmıştı. */
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
  if (res.status === 400 || res.status === 401 || res.status === 403)
    throw new InvalidRefreshTokenError(await readError(res))
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}
