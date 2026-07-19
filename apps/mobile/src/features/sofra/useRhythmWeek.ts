import { requireApi } from '@/data/api/apiHolder'
import type { ApiRhythmWeek } from '@/data/api/client'
import { useLiveValue } from '@/data/useLive'

/**
 * Kişisel afiyet ritmi haftası — backend hesaplar (afiyet günü = o gün ≥1
 * öğün kaydı), istemci gösterir. Öğün eklenince/silinince yeniden çekilir.
 *
 * undefined = yükleniyor · null = erişilemiyor · değer = veri
 */
export function useRhythmWeek(date: string): ApiRhythmWeek | null | undefined {
  return useLiveValue<ApiRhythmWeek | null>(
    ['meals'],
    async () => {
      try {
        return await requireApi().summaryWeek(date)
      } catch {
        return null
      }
    },
    [date],
  )
}
