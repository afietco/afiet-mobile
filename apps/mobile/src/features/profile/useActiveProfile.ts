import type { Profile } from '@afiet/core'
import { useCallback, useState } from 'react'
import { profileRepo } from '../../data/repositories'
import { useLiveValue } from '../../data/useLive'

/**
 * Online/kişi-başı model: cihaz-yerel aktif profil seçimi yok; profil,
 * giriş yapan kullanıcının backend profilidir. setActiveProfileId artık
 * gereksiz (onboarding hâlâ çağırıyor) → no-op.
 */
export function setActiveProfileId(_id: number) {
  // no-op
}

/**
 * Giriş yapan kullanıcının profili. İsim yoksa profil henüz "kurulmamış"
 * sayılır (bare satır ensureProfile ile oluşmuş olabilir) → id null döner,
 * böylece mevcut onboarding kapısı (`id === null → /onboarding`) korunur.
 */
export function useActiveProfile() {
  const [attempt, setAttempt] = useState(0)
  const result = useLiveValue<{ attempt: number; profile: Profile | null; error: Error | null }>(
    ['profiles'],
    async () => {
      try {
        const p = await profileRepo.first()
        return { attempt, profile: p && p.name ? p : null, error: null }
      } catch (error) {
        // A network or API failure does not mean the profile is missing. Keeping
        // these states separate prevents existing users from entering onboarding.
        return {
          attempt,
          profile: null,
          error: error instanceof Error ? error : new Error('Profil yüklenemedi'),
        }
      }
    },
    [attempt],
  )
  const retry = useCallback(() => setAttempt((current) => current + 1), [])

  return {
    id: result?.profile?.id ?? null,
    profile: result?.profile ?? null,
    loading: result === undefined,
    error: result?.error ?? null,
    retry,
    retrying: result !== undefined && result.attempt !== attempt,
  }
}
