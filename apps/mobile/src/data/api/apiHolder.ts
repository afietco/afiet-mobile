/**
 * Modül düzeyinde apiClient tutucusu. Repository'ler singleton olarak
 * import edilir (`import { mealRepo }`), ama token AuthContext'te yaşar ;
 * AuthProvider giriş/çıkışta buradaki istemciyi set eder, repo'lar okur.
 */
import type { ApiClient, AuthedFetch } from './client'

let current: ApiClient | null = null
let currentStreamFetch: AuthedFetch | null = null

/**
 * Thrown when a repository call runs before the authenticated session has bound
 * the client. This is a transient startup condition, not a real failure, so
 * callers can distinguish it from a genuine API error and stay in a loading
 * state instead of surfacing an error screen.
 */
export class ApiNotReadyError extends Error {
  constructor() {
    super('API istemcisi hazır değil; giriş gerekli')
    this.name = 'ApiNotReadyError'
  }
}

export function setApiClient(client: ApiClient | null): void {
  current = client
}

/** Aktif API istemcisi. Giriş yapılmadan çağrılırsa ApiNotReadyError verir. */
export function requireApi(): ApiClient {
  if (!current) throw new ApiNotReadyError()
  return current
}

/**
 * Streaming-capable authed fetch (expo/fetch based). React Native's global
 * fetch cannot expose a response body stream, so SSE consumers get their own
 * fetch, bound to the session exactly like the API client.
 */
export function setStreamFetch(fn: AuthedFetch | null): void {
  currentStreamFetch = fn
}

export function requireStreamFetch(): AuthedFetch {
  if (!currentStreamFetch) throw new ApiNotReadyError()
  return currentStreamFetch
}
