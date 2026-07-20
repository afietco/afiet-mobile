import { requireApi } from '@/data/api/apiHolder'
import type { ApiRhythmHistory } from '@/data/api/client'
import { useLive, type LiveQueryResult } from '@/data/useLive'

/** Rhythm history with explicit loading, error, and retry state. */
export function useRhythmHistoryResult(date: string): LiveQueryResult<ApiRhythmHistory> {
  return useLive<ApiRhythmHistory>(
    ['meals'],
    () => requireApi().rhythmHistory(date),
    [date],
  )
}

/** Compatibility value for consumers that can render without history. */
export function useRhythmHistory(date: string): ApiRhythmHistory | undefined {
  return useRhythmHistoryResult(date).data
}
