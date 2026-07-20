import type { ApiSummary } from './api/client'
import { requireApi } from './api/apiHolder'
import { useLive, type LiveQueryResult } from './useLive'

const SUMMARY_TABLES = ['meals', 'water', 'measurements', 'profiles', 'customFoods'] as const

/** Daily backend summary with explicit loading, error, and retry state. */
export function useSummaryResult(date: string): LiveQueryResult<ApiSummary> {
  return useLive(
    [...SUMMARY_TABLES],
    () => requireApi().getSummary(date),
    [date],
  )
}

/** Compatibility value for components that can render without the summary. */
export function useSummary(date: string): ApiSummary | undefined {
  return useSummaryResult(date).data
}
