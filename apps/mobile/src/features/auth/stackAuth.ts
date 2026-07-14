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

/** Content-Type BURADA YOK — Stack Auth, gövdesiz istekte bile Content-Type
    application/json görürse gövdeyi parse etmeye kalkıp 400 BODY_PARSING_ERROR
    döner. JSON gönderen çağrı başlığı kendisi ekler (ve gövdeyi boş bırakmaz). */
function stackHeaders(): Record<string, string> {
  return {
    'X-Stack-Access-Type': 'client',
    'X-Stack-Project-Id': config.stackProjectId,
  }
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
