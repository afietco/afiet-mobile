/**
 * Auth durumu ve backend erişimi. Token'ları saklar, Stack Auth ile giriş/
 * kayıt yapar ve 401'de sessizce yenileyen bir authedFetch (+ apiClient) sağlar.
 * Uygulama kökünde AuthProvider ile sarılır; ekranlar useAuth() kullanır.
 */
import { fetch as expoFetch } from 'expo/fetch'
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { config } from '@/config'
import { setApiClient, setStreamFetch } from '@/data/api/apiHolder'
import { createApiClient, type ApiClient, type AuthedFetch } from '@/data/api/client'
import { snapshotCacheOptions } from '@/data/api/snapshotBridge'
import {
  hydrateLastKnownSnapshots,
  hydrateSnapshots,
  hydratedAccountId,
  rememberSnapshotAccount,
} from '@/data/api/snapshotStore'
import { notify } from '@/data/live'
import { loadChapters } from '@/features/ftue/chapter-store'
import { loadFtueAccountFlags } from '@/features/ftue/ftueFlags'
import { unregisterCurrentPushDevice } from '@/features/push/push-notifications'
import { signInWithGoogleFlow } from './googleSignIn'
import { clearLocalSession } from './localSessionReset'
import { SessionEpoch } from './sessionEpoch'
import {
  createEmailChannel,
  deleteContactChannel,
  deleteCurrentUser as deleteStackUser,
  getCurrentUser,
  InvalidRefreshTokenError,
  listContactChannels,
  refreshAccessToken,
  revokeCurrentSession,
  sendVerificationEmail as apiSendVerificationEmail,
  setPassword as apiSetPassword,
  signIn as apiSignIn,
  signInWithAppleToken,
  signUp as apiSignUp,
  StackUnauthorizedError,
  type StackUser,
  updateContactChannel,
  updateDisplayName,
  updatePassword,
  userIdFromAccessToken,
} from './stackAuth'
import { loadTokens, saveTokens } from './tokenStore'

type Status = 'loading' | 'authed' | 'anon'
type SessionEndReason = 'expired' | null

interface AuthValue {
  status: Status
  /** Distinguishes an expired remote session from an intentional local sign-out. */
  sessionEndReason: SessionEndReason
  /** Giriş yapan kullanıcının Stack Auth id'si (aile üyeliği vb. için). */
  userId: string | null
  signIn: (identifier: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  /** Apple identityToken'ı ile giriş (gerekirse kullanıcıyı oluşturur). İlk
      girişte Apple'ın verdiği ad doluysa best-effort profile yazılır (hata
      yutulur, girişi engellemez; Stack bu adı kendisi saklamaz). */
  signInWithApple: (idToken: string, suggestedDisplayName: string | null) => Promise<void>
  /** Google ile giriş: sistem tarayıcısında PKCE akışı yürütür (Stack'te
      Google için native token exchange yok). true = giriş oldu; false =
      kullanıcı tarayıcıyı kapatıp vazgeçti (hata gösterilmez). Görünen adı
      Google verir ve Stack OAuth callback'te kendisi kaydeder; Apple'daki
      gibi elle yazmak gerekmez. */
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  /** Stack Auth kimliğini best-effort siler (proje ayarı açıksa). Hata atmaz. */
  deleteAuthUser: () => Promise<void>
  /** Giriş yapan kullanıcının Stack Auth profilini okur (e-posta, doğrulama
      durumu…). 401'de bir kez token yenileyip tekrar dener. Oturum yoksa null. */
  getStackUser: () => Promise<StackUser | null>
  /** Giriş yapan kullanıcının şifresini değiştirir. 401'de bir kez token yenileyip
      tekrar dener. Başarıda token'lar değişmez (bu cihaz oturumda kalır); diğer
      cihazların oturumları güvenlik için Stack tarafında iptal olur. Hatada
      okunur Türkçe mesajla throw eder (çağıran sheet'te gösterir). */
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  /** OAuth (Apple) ile gelmiş şifresiz kullanıcıya şifre belirler. 401'de bir
      kez token yenileyip tekrar dener. Diğer cihaz oturumlarına dokunmaz.
      Hatada okunur Türkçe mesajla throw eder (çağıran sheet'te gösterir). */
  setPassword: (password: string) => Promise<void>
  /** Birincil e-postaya doğrulama maili gönderir. 401'de bir kez token yenileyip
      tekrar dener. E-posta zaten doğrulanmışsa hata SAYILMAZ (stackAuth katmanı
      sessizce başarı döndürür); çağıran rozeti tazeler. Hatada okunur Türkçe
      mesajla throw eder (çağıran gösterir). */
  sendVerificationEmail: () => Promise<void>
  /** E-posta değiştirme 1/3: yeni adrese doğrulanmamış, girişe kapalı bir kanal
      açar ve doğrulama maili gönderir; kanal id'sini döner. Mail gönderilemezse
      kanal best-effort geri alınır ve asıl hata yükselir (yarım durum kalmaz).
      Tüm e-posta değiştirme adımları 401'de bir kez token yenileyip tekrar dener. */
  startEmailChange: (newEmail: string) => Promise<string>
  /** Bekleme adımında doğrulama mailini AYNI kanala yeniden gönderir. */
  resendEmailChangeVerification: (channelId: string) => Promise<void>
  /** E-posta değiştirme 2/3: kanal maildeki bağlantıyla doğrulandı mı? Kanal
      listede yoksa (örn. başka oturumdan silindi) okunur Türkçe hatayla throw
      eder; çağıran akışı baştan başlatır. */
  isEmailChangeVerified: (channelId: string) => Promise<boolean>
  /** E-posta değiştirme 3/3: doğrulanmış kanalı girişe açıp birincil yapar
      (kritik adım, hatası yükselir); ardından eski e-posta kanallarını siler
      ve backend profilindeki e-posta kopyasını günceller. Bu iki kuyruk işi
      best-effort'tur, hataları akışı BOZMAZ (kaynak doğruluk Stack'te). */
  finalizeEmailChange: (channelId: string, newEmail: string) => Promise<void>
  /** Deletes an unfinished email-change channel. Cleanup failures are exposed
      so the caller can keep its durable reference and retry later. */
  abortEmailChange: (channelId: string) => Promise<void>
  api: ApiClient
  /** Session-bound streaming fetch (expo/fetch); SSE consumers only. */
  streamFetch: AuthedFetch
}

const AuthContext = createContext<AuthValue | null>(null)

class StaleSessionRefreshError extends Error {}

interface RefreshFlight {
  epoch: number
  promise: Promise<string>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [sessionEndReason, setSessionEndReason] = useState<SessionEndReason>(null)
  // Token'lar ref'te; authedFetch her zaman en güncelini görsün (stale closure yok).
  const access = useRef<string | null>(null)
  const refresh = useRef<string | null>(null)
  // userId de ref'te; status 'authed'e dönmeden önce set edilir, memo onu okur.
  const userId = useRef<string | null>(null)
  const sessionEpoch = useRef(new SessionEpoch())
  // Single-flight refreshes are scoped to the session epoch that started them.
  const refreshInFlight = useRef<RefreshFlight | null>(null)

  useEffect(() => {
    /* Both halves of a session restore start at once. Reading the tokens is a
       Keychain round trip and the account id only exists once it lands, so
       hydration used to queue behind it; the remembered account lets the disk
       mirror be read at the same time instead. When the restored session turns
       out to be that same account, which is the overwhelmingly common case,
       the hydration below is already done and costs nothing. */
    void Promise.all([loadTokens(), hydrateLastKnownSnapshots()])
      .then(async ([t]) => {
        if (t) {
          access.current = t.accessToken
          refresh.current = t.refreshToken
          // Diskten geri yüklenen oturumda userId ayrı saklanmaz → token'dan çöz.
          userId.current = userIdFromAccessToken(t.accessToken)
          /* Snapshots are hydrated behind the splash, alongside the FTUE flags:
             a screen that queries before the mirror is warm would paint the
             skeleton this layer exists to remove. */
          if (userId.current) {
            const account = userId.current
            await Promise.all([
              loadFtueAccountFlags(account),
              loadChapters(account),
              hydratedAccountId() === account ? Promise.resolve() : hydrateSnapshots(account),
            ])
            void rememberSnapshotAccount(account)
          }
          setStatus('authed')
        } else {
          setStatus('anon')
        }
      })
      .catch(() => {
        // Restoring the session must never hang the splash forever: any failure
        // here (unreadable Keychain, corrupt persisted flags) falls back to the
        // anonymous flow so the user reaches login instead of a frozen skeleton.
        setStatus('anon')
      })
  }, [])

  async function setSession(t: { accessToken: string; refreshToken: string; userId: string }) {
    const epoch = sessionEpoch.current.beginSession()
    refreshInFlight.current = null
    access.current = t.accessToken
    refresh.current = t.refreshToken
    userId.current = t.userId ?? userIdFromAccessToken(t.accessToken)
    if (userId.current) {
      const account = userId.current
      await Promise.all([
        loadFtueAccountFlags(account),
        loadChapters(account),
        hydrateSnapshots(account),
      ])
      void rememberSnapshotAccount(account)
    }
    const persisted = await sessionEpoch.current.persistIfCurrent(epoch, () => saveTokens(t))
    if (!persisted) return
    setSessionEndReason(null)
    setStatus('authed')
  }

  const value = useMemo<AuthValue>(() => {
    // Tek uçuşlu yenileme: aynı anda 401 alan tüm istekler (backend + Stack)
    // aynı refresh çağrısını paylaşır. Yeni access token'ı diske yazıp döndürür.
    // Refresh token gerçekten geçersizse (InvalidRefreshTokenError) oturumu
    // kapatır (anon); geçici hatalarda oturuma dokunmadan hatayı yükseltir.
    const refreshOnce = async (): Promise<string> => {
      const rt = refresh.current
      if (!rt) throw new InvalidRefreshTokenError('refresh token yok')
      const epoch = sessionEpoch.current.capture()
      try {
        let flight = refreshInFlight.current
        if (!flight || flight.epoch !== epoch) {
          const refreshPromise = (async () => {
            const fresh = await refreshAccessToken(rt)
            if (!sessionEpoch.current.isCurrent(epoch) || refresh.current !== rt)
              throw new StaleSessionRefreshError()

            access.current = fresh
            const persisted = await sessionEpoch.current.persistIfCurrent(epoch, () =>
              saveTokens({ accessToken: fresh, refreshToken: rt }),
            )
            if (!persisted) throw new StaleSessionRefreshError()
            return fresh
          })()
          const trackedPromise = refreshPromise.finally(() => {
            if (refreshInFlight.current?.promise === trackedPromise)
              refreshInFlight.current = null
          })
          flight = { epoch, promise: trackedPromise }
          refreshInFlight.current = flight
        }
        return await flight.promise
      } catch (e) {
        if (e instanceof InvalidRefreshTokenError && sessionEpoch.current.isCurrent(epoch)) {
          // Refresh token gerçekten geçersiz → oturum bitti.
          sessionEpoch.current.invalidate()
          refreshInFlight.current = null
          access.current = null
          refresh.current = null
          const endingUserId = userId.current
          userId.current = null
          await sessionEpoch.current.waitForPendingWrites()
          await clearLocalSession(endingUserId)
          setSessionEndReason('expired')
          setStatus('anon')
        }
        throw e
      }
    }

    // authedFetch: backend'e token ekler; 401'de bir kez yeniler ve tekrar dener.
    // The fetch implementation is pluggable: the API client rides the global
    // fetch, SSE consumers ride expo/fetch (the only one whose response body
    // streams on React Native). Both share this token logic.
    const authedFetchWith =
      (fetchImpl: typeof fetch): AuthedFetch =>
      async (path: string, init?: RequestInit): Promise<Response> => {
        const call = (token: string | null) =>
          fetchImpl(`${config.apiUrl}${path}`, {
            ...init,
            headers: {
              ...(init?.headers as Record<string, string> | undefined),
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })

        let res = await call(access.current)
        if (res.status === 401 && refresh.current) {
          try {
            res = await call(await refreshOnce())
          } catch {
            // Geçici hata (ağ kopması, 5xx): oturuma DOKUNMA, 401 yanıtı çağrana
            // döner, bir sonraki istek yenilemeyi yeniden dener. Kalıcı hatada
            // refreshOnce zaten anon'a geçmiştir.
          }
        }
        return res
      }
    const authedFetch = authedFetchWith(fetch)
    // expo/fetch is WinterCG fetch; its types differ from lib.dom's but the
    // subset used here (url, method/headers/body/signal, Response status and
    // body stream) is shared.
    const streamFetch = authedFetchWith(expoFetch as unknown as typeof fetch)

    // Stack çağrısını 401'de bir kez token yenileyip tekrar dener (getStackUser/
    // changePassword'daki desenin ortak hali). E-posta değiştirme adımları birden
    // çok Stack çağrısı zincirlediğinden deseni buradan paylaşır; her çağrı
    // access.current'ı taze okur, önceki adımın yenilediği token'ı görür.
    const withStackRetry = async <T,>(call: (accessToken: string) => Promise<T>): Promise<T> => {
      const token = access.current
      if (!token) throw new Error('Oturumun bulunamadı. Tekrar giriş yapmayı dene.')
      try {
        return await call(token)
      } catch (e) {
        if (e instanceof StackUnauthorizedError && refresh.current) {
          return call(await refreshOnce())
        }
        throw e
      }
    }

    // Backend istemcisi hem dışarı (value.api) verilir hem finalizeEmailChange
    // içinde best-effort profil senkronu için kullanılır.
    const api = createApiClient(authedFetch, snapshotCacheOptions)

    /* user_profiles.email would otherwise stay empty: the Stack access token
       carries no email claim and the backend reads the address from that
       claim. The address at hand is written best-effort instead (the form
       value on credential sign-up, Stack's primary address on social sign-in,
       which is the relay address when Apple's "Hide My Email" was chosen).
       Social sign-in syncs on EVERY sign-in, not only the first one: the
       provider-side address can change afterwards (revoking the Apple
       authorization and re-authorizing with "Share My Email" is the only way
       to undo a relay address, and it keeps the same Apple user identifier,
       so the account is no longer new and a first-sign-in-only sync would
       leave the stale relay address behind forever). Errors are swallowed:
       failing to write the address does not make the sign-in fail. */
    const syncProviderEmail = (accessToken: string, knownEmail?: string) => {
      void (async () => {
        try {
          const email = knownEmail ?? (await getCurrentUser(accessToken)).primaryEmail
          if (email) await api.updateProfile({ email })
        } catch {
          // Best-effort; hesap ekranındaki e-posta akışı her zaman düzeltebilir.
        }
      })()
    }

    return {
      status,
      sessionEndReason,
      userId: userId.current,
      api,
      streamFetch,
      signIn: async (identifier, password) => {
        const t = await apiSignIn(identifier, password)
        await setSession(t)
      },
      signUp: async (email, password) => {
        const t = await apiSignUp(email, password)
        await setSession(t)
        syncProviderEmail(t.accessToken, email.trim().toLowerCase())
      },
      signInWithApple: async (idToken, suggestedDisplayName) => {
        const t = await signInWithAppleToken(idToken)
        await setSession(t)
        syncProviderEmail(t.accessToken)
        // Apple adı YALNIZ ilk yetkilendirmede verir ve Stack saklamaz →
        // yeni kullanıcıda best-effort profile yazılır. Hata yutulur:
        // ad yazılamasa da giriş başarılıdır, akış kesilmez.
        if (t.isNewUser && suggestedDisplayName) {
          try {
            await updateDisplayName(t.accessToken, suggestedDisplayName)
          } catch {
            // Best-effort: görünen ad sonradan profil ekranından da verilebilir.
          }
        }
      },
      signInWithGoogle: async () => {
        const t = await signInWithGoogleFlow()
        // null: kullanıcı tarayıcıyı kapatıp vazgeçti; oturum durumu değişmez.
        if (!t) return false
        await setSession(t)
        syncProviderEmail(t.accessToken)
        return true
      },
      signOut: async () => {
        // Sunucu oturumunu best-effort iptal et: token'ları temizlemeden ÖNCE
        // yakala, sonucu BEKLEME. Yerel çıkış (token temizliği + anon) her
        // koşulda ve çağrının sonucundan bağımsız garanti çalışır.
        const at = access.current
        const rt = refresh.current
        try {
          await unregisterCurrentPushDevice(api)
        } catch {
          // Push cleanup is best-effort; local session teardown must continue.
        }
        sessionEpoch.current.invalidate()
        refreshInFlight.current = null
        if (at && rt) {
          void revokeCurrentSession(at, rt).catch(() => {
            // Best-effort: ağ/geçici hata yerel çıkışı etkilemez.
          })
        }
        access.current = null
        refresh.current = null
        const endingUserId = userId.current
        userId.current = null
        await sessionEpoch.current.waitForPendingWrites()
        await clearLocalSession(endingUserId)
        setSessionEndReason(null)
        setStatus('anon')
      },
      deleteAuthUser: async () => {
        const token = access.current
        if (!token) return
        try {
          await deleteStackUser(token)
        } catch {
          // Best-effort: proje ayarı ("client user deletion") kapalıysa kimlik
          // kalır. Uygulama verisi zaten backend'den silindi; ardından çıkılır.
        }
      },
      getStackUser: async () => {
        const token = access.current
        if (!token) return null
        try {
          return await getCurrentUser(token)
        } catch (e) {
          // Access token süresi dolmuş (401) → bir kez yenile ve tekrar dene.
          // refreshOnce başarısızsa hata yükselir (çağıran sade metne düşer).
          if (e instanceof StackUnauthorizedError && refresh.current) {
            return getCurrentUser(await refreshOnce())
          }
          throw e
        }
      },
      changePassword: async (oldPassword, newPassword) => {
        const token = access.current
        const rt = refresh.current
        if (!token || !rt) throw new Error('Oturumun bulunamadı. Tekrar giriş yapmayı dene.')
        try {
          await updatePassword(token, rt, oldPassword, newPassword)
        } catch (e) {
          // Access token süresi dolmuş (401) → bir kez yenile ve tekrar dene
          // (getStackUser'daki desenin aynısı). Refresh token değişmez, aynı rt
          // yeniden gönderilir; başarıda bu cihaz oturumda kalır.
          if (e instanceof StackUnauthorizedError && refresh.current) {
            await updatePassword(await refreshOnce(), rt, oldPassword, newPassword)
            return
          }
          throw e
        }
      },
      setPassword: async (password) => {
        const token = access.current
        if (!token) throw new Error('Oturumun bulunamadı. Tekrar giriş yapmayı dene.')
        try {
          await apiSetPassword(token, password)
        } catch (e) {
          // Access token süresi dolmuş (401) → bir kez yenile ve tekrar dene
          // (changePassword'daki desenin aynısı).
          if (e instanceof StackUnauthorizedError && refresh.current) {
            await apiSetPassword(await refreshOnce(), password)
            return
          }
          throw e
        }
      },
      sendVerificationEmail: async () => {
        const token = access.current
        if (!token) throw new Error('Oturumun bulunamadı. Tekrar giriş yapmayı dene.')
        // Doğrulama maili kanal id'siyle gönderilir: önce birincil e-posta
        // kanalı bulunur, sonra o kanala mail istenir.
        const send = async (at: string) => {
          const channels = await listContactChannels(at)
          const primary = channels.find((c) => c.type === 'email' && c.isPrimary)
          if (!primary) throw new Error('Doğrulanacak e-posta adresi bulunamadı.')
          await apiSendVerificationEmail(at, primary.id)
        }
        try {
          await send(token)
        } catch (e) {
          // Access token süresi dolmuş (401) → bir kez yenile ve tekrar dene
          // (changePassword'daki desenin aynısı).
          if (e instanceof StackUnauthorizedError && refresh.current) {
            await send(await refreshOnce())
            return
          }
          throw e
        }
      },
      startEmailChange: async (newEmail) => {
        const channel = await withStackRetry((at) => createEmailChannel(at, newEmail))
        try {
          await withStackRetry((at) => apiSendVerificationEmail(at, channel.id))
        } catch (e) {
          // Mail gidemedi: kanal best-effort geri alınır ki kullanıcı tekrar
          // denediğinde yarım kanal çakışması yaşamasın; asıl hata yükselir.
          try {
            await withStackRetry((at) => deleteContactChannel(at, channel.id))
          } catch (cleanupError) {
            console.warn('[auth] yarım e-posta kanalı geri alınamadı', cleanupError)
          }
          throw e
        }
        return channel.id
      },
      resendEmailChangeVerification: (channelId) =>
        withStackRetry((at) => apiSendVerificationEmail(at, channelId)),
      isEmailChangeVerified: async (channelId) => {
        const channels = await withStackRetry((at) => listContactChannels(at))
        const channel = channels.find((c) => c.id === channelId)
        // Kanal yoksa (örn. başka oturumdan silindi) doğrulama beklemek anlamsız;
        // çağıran bu mesajı gösterir ve akış baştan başlatılır.
        if (!channel) throw new Error('Doğrulanacak e-posta bulunamadı. Akışı baştan başlat.')
        return channel.isVerified
      },
      finalizeEmailChange: async (channelId, newEmail) => {
        // Kritik adım: doğrulanmış kanal girişe açılır ve birincil yapılır.
        // Hatası yükselir; bundan sonrası temizlik/senkron olduğundan
        // best-effort ilerler ve akışı bozmaz.
        await withStackRetry((at) =>
          updateContactChannel(at, channelId, { usedForAuth: true, isPrimary: true }),
        )
        try {
          const channels = await withStackRetry((at) => listContactChannels(at))
          for (const c of channels) {
            if (c.type !== 'email' || c.id === channelId) continue
            try {
              await withStackRetry((at) => deleteContactChannel(at, c.id))
            } catch (err) {
              // Eski kanal kalsa da giriş artık yeni adresle; akış başarılıdır.
              console.warn('[auth] eski e-posta kanalı silinemedi', err)
            }
          }
        } catch (err) {
          console.warn('[auth] eski e-posta kanalları listelenemedi', err)
        }
        // Backend'deki e-posta kopyası best-effort senkronlanır: alanı henüz
        // tanımayan backend yok sayabilir ya da reddedebilir, ikisi de akışı
        // bozmaz (kaynak doğruluk Stack'te).
        try {
          await api.updateProfile({ email: newEmail })
        } catch (err) {
          console.warn('[auth] backend e-posta senkronu yapılamadı', err)
        }
      },
      abortEmailChange: async (channelId) => {
        await withStackRetry((at) => deleteContactChannel(at, channelId))
      },
    }
  }, [sessionEndReason, status])

  // Keep the module-scoped API client bound to the active authenticated session.
  useEffect(() => {
    if (status === 'authed') {
      setApiClient(value.api)
      setStreamFetch(value.streamFetch)
      notify('profiles')
    } else {
      setApiClient(null)
      setStreamFetch(null)
    }
  }, [status, value.api, value.streamFetch])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı')
  return ctx
}
