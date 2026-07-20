import { WATER_TARGET_GLASSES, todayISO, type Profile } from '@afiet/core'
import { useSummary } from '../../data/useSummary'

/**
 * Kişisel günlük su hedefi (bardak); backend'in TDEE'den türettiği değer
 * (summary.targets.waterGlasses). Vücut bilgisi/ölçüm yoksa backend genel
 * hedefe (8) düşer; summary henüz gelmediyse de aynı varsayılan.
 * İmza korunur (çağıranlar değişmez); parametreler artık kullanılmıyor.
 */
export function useWaterTarget(_profileId: number | null, _profile?: Profile): number {
  const summary = useSummary(todayISO())
  return summary?.targets.waterGlasses ?? WATER_TARGET_GLASSES
}
