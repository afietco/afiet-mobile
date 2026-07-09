import { useLiveQuery } from 'dexie-react-hooks'
import { measurementRepo } from '../../data/repositories'
import { WATER_TARGET_GLASSES, type Profile } from '../../data/types'
import { ageFromBirthDate, bmr, tdee, waterGlassesFromTdee } from './bodyMetrics'

/**
 * Kişisel günlük su hedefi (bardak) — TDEE'den türetilir.
 * Vücut bilgileri ya da ölçüm yoksa genel hedefe (8) düşer.
 */
export function useWaterTarget(profileId: number | null, profile?: Profile): number {
  const latest = useLiveQuery(
    () => (profileId ? measurementRepo.latest(profileId) : Promise.resolve(undefined)),
    [profileId],
  )
  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  if (!hasAttrs || !latest) return WATER_TARGET_GLASSES
  const bmrValue = bmr(profile.sex!, latest.weightKg, profile.heightCm!, ageFromBirthDate(profile.birthDate!))
  return waterGlassesFromTdee(tdee(bmrValue, profile.activityLevel!))
}
