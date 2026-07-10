import { WATER_TARGET_GLASSES, type Profile } from '@afiet/core'
import { waterGlassesFromTdee } from '@afiet/core'
import { useTdee } from './useTdee'

/**
 * Kişisel günlük su hedefi (bardak) — TDEE'den türetilir.
 * Vücut bilgileri ya da ölçüm yoksa genel hedefe (8) düşer.
 */
export function useWaterTarget(profileId: number | null, profile?: Profile): number {
  const tdeeValue = useTdee(profileId, profile)
  return tdeeValue == null ? WATER_TARGET_GLASSES : waterGlassesFromTdee(tdeeValue)
}
