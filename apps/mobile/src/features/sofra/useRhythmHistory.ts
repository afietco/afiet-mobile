import { requireApi } from '@/data/api/apiHolder'
import type { ApiRhythmHistory } from '@/data/api/client'
import { useLiveValue } from '@/data/useLive'

/**
 * Ritim geçmişi — geçmiş haftaların dökümü + toplam afiyet haftası (Profil).
 * Backend hesaplar; öğün değişince yeniden çekilir (bugünkü kayıt geçmişi
 * değiştirmez ama hafta devrilirse liste tazelenmiş olur).
 *
 * undefined = yükleniyor · null = erişilemiyor · değer = veri
 */
export function useRhythmHistory(date: string): ApiRhythmHistory | null | undefined {
  return useLiveValue<ApiRhythmHistory | null>(
    ['meals'],
    async () => {
      try {
        return await requireApi().rhythmHistory(date)
      } catch {
        return null
      }
    },
    [date],
  )
}
