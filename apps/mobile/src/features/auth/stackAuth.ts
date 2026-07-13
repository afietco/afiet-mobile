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

function stackHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Stack-Access-Type': 'client',
    'X-Stack-Project-Id': config.stackProjectId,
  }
}

// Stack Auth hata gövdesi: { code, error, details }. Kullanıcıya okunur mesaj.
async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { code?: string; error?: string }
    if (body.code === 'EMAIL_PASSWORD_MISMATCH') return 'E-posta veya şifre hatalı.'
    if (body.code === 'USER_EMAIL_ALREADY_EXISTS') return 'Bu e-posta zaten kayıtlı.'
    if (body.code === 'PASSWORD_TOO_SHORT') return 'Şifre en az 8 karakter olmalı.'
    return body.error ?? 'Bir şeyler ters gitti.'
  } catch {
    return 'Bir şeyler ters gitti.'
  }
}

async function authRequest(path: string, body: unknown): Promise<AuthTokens> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/${path}`, {
    method: 'POST',
    headers: stackHeaders(),
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

/** Refresh token ile yeni access token alır (refresh token değişmez). */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(`${config.stackBaseUrl}/api/v1/auth/sessions/current/refresh`, {
    method: 'POST',
    headers: { ...stackHeaders(), 'X-Stack-Refresh-Token': refreshToken },
  })
  if (!res.ok) throw new Error(await readError(res))
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}
