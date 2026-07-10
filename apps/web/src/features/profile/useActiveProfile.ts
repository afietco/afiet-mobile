import { useLiveQuery } from 'dexie-react-hooks'
import { profileRepo } from '../../data/repositories'

const KEY = 'fh:activeProfileId'

/** Onboarding sonunda cihazın profili sabitlenir */
export function setActiveProfileId(id: number) {
  localStorage.setItem(KEY, String(id))
}

/**
 * Cihazın tek profili. Eski çoklu profil kurulumlarından kalan
 * veritabanlarında kayıtlı aktif profil, yoksa ilk profil kullanılır.
 */
export function useActiveProfile() {
  const profile = useLiveQuery(async () => {
    const raw = localStorage.getItem(KEY)
    const byId = raw ? await profileRepo.get(Number(raw)) : undefined
    const p = byId ?? (await profileRepo.first()) ?? null
    if (p?.id && String(p.id) !== raw) localStorage.setItem(KEY, String(p.id))
    return p
  }, [])
  return {
    id: profile?.id ?? null,
    profile: profile ?? null,
    loading: profile === undefined,
  }
}
