export const SESSION_EXPIRED_REASON = 'session-expired'

const PUBLIC_AUTH_PATHS = new Set(['/intro', '/first-meal', '/login', '/onboarding'])

export function safeAuthReturnPath(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) return '/'

  const pathname = candidate.split(/[?#]/, 1)[0]
  if (PUBLIC_AUTH_PATHS.has(pathname)) return '/'

  return pathname
}
