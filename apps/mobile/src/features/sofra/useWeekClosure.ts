import { todayISO } from '@afiet/core'
import { useEffect, useState } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import type { WeekClosure } from './WeekCloseCelebration'

/**
 * Hafta kapanışı tetiği — backend karar verir (GET /v1/summary/week/closure):
 * pazar günü hedef tutmuşsa o gün, değilse hafta bitince GEÇEN hafta için;
 * yalnızca hedefe (5 afiyet günü) ulaşan hafta ve hesap başına bir kez
 * (ack sunucuda saklanır, cihaz değişse de tekrarlamaz). Ulaşılamayan
 * haftada closure null gelir — hiçbir şey gösterilmez, kayıp dili yok.
 */

// Açılış başına tek kontrol — kutlama nadir bir an, her odakta sorgulanmaz.
let checkedThisLaunch = false

export function useWeekClosure(): { closure: WeekClosure | null; ack: () => void } {
  const [closure, setClosure] = useState<WeekClosure | null>(null)

  useEffect(() => {
    if (checkedThisLaunch) return
    checkedThisLaunch = true
    void (async () => {
      try {
        const res = await requireApi().weekClosure(todayISO())
        if (res.closure) setClosure({ ...res.closure, totalWeeks: res.totalWeeks })
      } catch {
        // kutlama kritik değil — erişilemezse sessizce geç
      }
    })()
  }, [])

  return {
    closure,
    ack: () => {
      const weekStart = closure?.weekStart
      setClosure(null)
      if (weekStart) {
        // best-effort: işaret gitmezse kutlama bir dahaki açılışta tekrarlanabilir
        requireApi()
          .ackWeekClosure(weekStart)
          .catch(() => {})
      }
    },
  }
}
