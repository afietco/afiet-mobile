/**
 * Auth durumu ve backend erişimi. Token'ları saklar, Stack Auth ile giriş/
 * kayıt yapar ve 401'de sessizce yenileyen bir authedFetch (+ apiClient) sağlar.
 * Uygulama kökünde AuthProvider ile sarılır; ekranlar useAuth() kullanır.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { config } from '@/config'
import { createApiClient, type ApiClient } from '@/data/api/client'
import { refreshAccessToken, signIn as apiSignIn, signUp as apiSignUp } from './stackAuth'
import { clearTokens, loadTokens, saveTokens } from './tokenStore'

type Status = 'loading' | 'authed' | 'anon'

interface AuthValue {
  status: Status
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  api: ApiClient
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  // Token'lar ref'te — authedFetch her zaman en güncelini görsün (stale closure yok).
  const access = useRef<string | null>(null)
  const refresh = useRef<string | null>(null)

  useEffect(() => {
    void loadTokens().then((t) => {
      if (t) {
        access.current = t.accessToken
        refresh.current = t.refreshToken
        setStatus('authed')
      } else {
        setStatus('anon')
      }
    })
  }, [])

  async function setSession(t: { accessToken: string; refreshToken: string }) {
    access.current = t.accessToken
    refresh.current = t.refreshToken
    await saveTokens(t)
    setStatus('authed')
  }

  const value = useMemo<AuthValue>(() => {
    // authedFetch: token ekler; 401'de bir kez yeniler ve tekrar dener.
    const authedFetch = async (path: string, init?: RequestInit): Promise<Response> => {
      const call = (token: string | null) =>
        fetch(`${config.apiUrl}${path}`, {
          ...init,
          headers: {
            ...(init?.headers as Record<string, string> | undefined),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

      let res = await call(access.current)
      if (res.status === 401 && refresh.current) {
        try {
          const fresh = await refreshAccessToken(refresh.current)
          access.current = fresh
          await saveTokens({ accessToken: fresh, refreshToken: refresh.current })
          res = await call(fresh)
        } catch {
          // Yenileme de başarısız → oturumu kapat.
          access.current = null
          refresh.current = null
          await clearTokens()
          setStatus('anon')
        }
      }
      return res
    }

    return {
      status,
      api: createApiClient(authedFetch),
      signIn: async (email, password) => {
        const t = await apiSignIn(email, password)
        await setSession(t)
      },
      signUp: async (email, password) => {
        const t = await apiSignUp(email, password)
        await setSession(t)
      },
      signOut: async () => {
        access.current = null
        refresh.current = null
        await clearTokens()
        setStatus('anon')
      },
    }
  }, [status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı')
  return ctx
}
