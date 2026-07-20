/**
 * Modül düzeyinde apiClient tutucusu. Repository'ler singleton olarak
 * import edilir (`import { mealRepo }`), ama token AuthContext'te yaşar ;
 * AuthProvider giriş/çıkışta buradaki istemciyi set eder, repo'lar okur.
 */
import type { ApiClient } from './client'

let current: ApiClient | null = null

export function setApiClient(client: ApiClient | null): void {
  current = client
}

/** Aktif API istemcisi. Giriş yapılmadan çağrılırsa hata verir. */
export function requireApi(): ApiClient {
  if (!current) throw new Error('API istemcisi hazır değil; giriş gerekli')
  return current
}
