import { profileRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'

/**
 * Online/kişi-başı model: cihaz-yerel aktif profil seçimi yok — profil,
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
  const profile = useLive(
    ['profiles'],
    async () => {
      try {
        const p = await profileRepo.first()
        return p && p.name ? p : null
      } catch {
        // Giriş yapılmadıysa API istemcisi hazır değildir → profil yok say.
        return null
      }
    },
    [],
  )
  return {
    id: profile?.id ?? null,
    profile: profile ?? null,
    loading: profile === undefined,
  }
}
