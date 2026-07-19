import type { Profile } from '@afiet/core'
import { ageFromBirthDate, bmr, tdee } from '@afiet/core'
import { measurementRepo } from '../../data/repositories'
import { useLiveValue } from '../../data/useLive'

/**
 * Profilin güncel TDEE'si (kcal/gün) — vücut bilgileri ve en az bir
 * kilo ölçümü gerektirir; eksikse null. (web useTdee.ts portu)
 */
export function useTdee(profileId: number | null, profile?: Profile): number | null {
  const latest = useLiveValue(
    ['measurements'],
    () => (profileId ? measurementRepo.latest(profileId) : Promise.resolve(undefined)),
    [profileId],
  )
  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  if (!hasAttrs || !latest) return null
  const bmrValue = bmr(profile.sex!, latest.weightKg, profile.heightCm!, ageFromBirthDate(profile.birthDate!))
  return tdee(bmrValue, profile.activityLevel!)
}
