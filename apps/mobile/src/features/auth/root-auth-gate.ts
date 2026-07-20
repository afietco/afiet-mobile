import type { Href } from 'expo-router'
import { safeAuthReturnPath, SESSION_EXPIRED_REASON } from './auth-return'

type AuthStatus = 'loading' | 'authed' | 'anon'

interface RootAuthRedirectInput {
  status: AuthStatus
  sessionExpired: boolean
  pathname: string
  welcomeIntroSeen: boolean
  firstValueCaptured: boolean
}

const PUBLIC_ROOT_PATHS = new Set(['/intro', '/first-meal', '/login'])

export function isPublicRootPath(pathname: string): boolean {
  return PUBLIC_ROOT_PATHS.has(pathname) || pathname.startsWith('/katil/')
}

/** Returns the authentication destination for any protected root route. */
export function getRootAuthRedirect({
  status,
  sessionExpired,
  pathname,
  welcomeIntroSeen,
  firstValueCaptured,
}: RootAuthRedirectInput): Href | null {
  if (status !== 'anon' || isPublicRootPath(pathname)) return null

  const returnTo = safeAuthReturnPath(pathname)
  if (sessionExpired) {
    return {
      pathname: '/login',
      params: { reason: SESSION_EXPIRED_REASON, returnTo },
    }
  }
  if (!welcomeIntroSeen) return '/intro'
  if (!firstValueCaptured) return '/first-meal'
  return { pathname: '/login', params: { returnTo } }
}
