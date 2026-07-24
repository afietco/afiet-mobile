import type { Profile } from '@afiet/core'
import { useCallback, useState } from 'react'
import { ApiNotReadyError } from '../../data/api/apiHolder'
import { profileRepo } from '../../data/repositories'
import { useLiveValue } from '../../data/useLive'
import { useAuth } from '../auth/AuthContext'

/**
 * Online/kişi-başı model: cihaz-yerel aktif profil seçimi yok; profil,
 * giriş yapan kullanıcının backend profilidir. setActiveProfileId artık
 * gereksiz (onboarding hâlâ çağırıyor) → no-op.
 */
export function setActiveProfileId(_id: number) {
  // no-op
}

/**
 * 'pending' covers the cold-start window where the tabs mount before the
 * authenticated session binds the API client. It is deliberately distinct from
 * a resolved 'ready' state so the gate shows the loading skeleton instead of a
 * transient failure screen.
 */
type ProfileResolution =
  | { phase: 'pending' }
  | { phase: 'ready'; attempt: number; profile: Profile | null; error: Error | null }

/**
 * Giriş yapan kullanıcının profili. İsim yoksa profil henüz "kurulmamış"
 * sayılır (bare satır ensureProfile ile oluşmuş olabilir) → id null döner,
 * böylece mevcut onboarding kapısı (`id === null → /onboarding`) korunur.
 */
export function useActiveProfile() {
  const { status } = useAuth()
  const [attempt, setAttempt] = useState(0)
  const result = useLiveValue<ProfileResolution>(
    ['profiles'],
    async () => {
      // Before the session is authenticated the API client is not bound yet.
      // Reporting that as loading (not an error) keeps the gate on the skeleton
      // through a normal launch and avoids flashing "profile unreachable".
      if (status !== 'authed') return { phase: 'pending' }
      try {
        const p = await profileRepo.first()
        return { phase: 'ready', attempt, profile: p && p.name ? p : null, error: null }
      } catch (error) {
        // The client can also be momentarily unbound right as status flips to
        // authed (the bind effect runs after this query). That window is still
        // "loading", never a failure the user should see.
        if (error instanceof ApiNotReadyError) return { phase: 'pending' }
        // A network or API failure does not mean the profile is missing. Keeping
        // these states separate prevents existing users from entering onboarding.
        return {
          phase: 'ready',
          attempt,
          profile: null,
          error: error instanceof Error ? error : new Error('Profil yüklenemedi'),
        }
      }
    },
    [attempt, status],
  )
  const retry = useCallback(() => setAttempt((current) => current + 1), [])

  const ready = result?.phase === 'ready' ? result : null

  return {
    id: ready?.profile?.id ?? null,
    profile: ready?.profile ?? null,
    loading: result === undefined || result.phase === 'pending',
    error: ready?.error ?? null,
    retry,
    retrying: ready !== null && ready.attempt !== attempt,
  }
}
