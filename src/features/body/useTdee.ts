import { useLiveQuery } from 'dexie-react-hooks'
import { measurementRepo } from '../../data/repositories'
import type { Profile } from '../../data/types'
import { ageFromBirthDate, bmr, tdee } from './bodyMetrics'

/**
 * Profilin güncel TDEE'si (kcal/gün) — vücut bilgileri ve en az bir
 * kilo ölçümü gerektirir; eksikse null.
 */
export function useTdee(profileId: number | null, profile?: Profile): number | null {
  const latest = useLiveQuery(
    () => (profileId ? measurementRepo.latest(profileId) : Promise.resolve(undefined)),
    [profileId],
  )
  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  if (!hasAttrs || !latest) return null
  const bmrValue = bmr(profile.sex!, latest.weightKg, profile.heightCm!, ageFromBirthDate(profile.birthDate!))
  return tdee(bmrValue, profile.activityLevel!)
}
