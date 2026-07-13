import type { ApiSummary } from './api/client'
import { requireApi } from './api/apiHolder'
import { useLive } from './useLive'

/**
 * Backend'in hesapladığı gün özeti (Bugün + Vücudum). Türev sayıların TEK
 * kaynağı: BMI/BMR/TDEE, makro toplamı+hedefler, su, streak, denge. İstemci
 * hesaplamaz — bunu okur. İlgili tablolardan biri değişince yeniden çekilir
 * (useLive/notify), böylece öğün/su/ölçüm eklenince anında güncellenir.
 *
 * undefined = yükleniyor · null = erişilemiyor (girişsiz/hata) · değer = veri
 */
export function useSummary(date: string): ApiSummary | null | undefined {
  return useLive<ApiSummary | null>(
    ['meals', 'water', 'measurements', 'profiles', 'customFoods'],
    async () => {
      try {
        return await requireApi().getSummary(date)
      } catch {
        return null
      }
    },
    [date],
  )
}
