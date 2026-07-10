import AsyncStorage from '@react-native-async-storage/async-storage'
import { profileRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'

const KEY = 'fh:activeProfileId'

/** Onboarding sonunda cihazın profili sabitlenir */
export function setActiveProfileId(id: number) {
  void AsyncStorage.setItem(KEY, String(id))
}

/**
 * Cihazın tek profili — web'deki useActiveProfile'ın birebir karşılığı.
 * Kayıtlı aktif profil, yoksa ilk profil kullanılır.
 */
export function useActiveProfile() {
  const profile = useLive(
    ['profiles'],
    async () => {
      const raw = await AsyncStorage.getItem(KEY)
      const byId = raw ? await profileRepo.get(Number(raw)) : undefined
      const p = byId ?? (await profileRepo.first()) ?? null
      if (p?.id && String(p.id) !== raw) void AsyncStorage.setItem(KEY, String(p.id))
      return p
    },
    [],
  )
  return {
    id: profile?.id ?? null,
    profile: profile ?? null,
    loading: profile === undefined,
  }
}
