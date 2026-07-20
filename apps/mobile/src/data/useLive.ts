import { useCallback, useEffect, useRef, useState } from 'react'
import { jsonEqual } from './equal'
import { subscribe, type TableName } from './live'
import { executeLiveQuery } from './liveQuery'

export interface LiveQueryResult<T> {
  data: T | undefined
  error: Error | null
  loading: boolean
  retry: () => void
}

interface LiveQueryState<T> {
  data: T | undefined
  error: Error | null
  pending: boolean
}

/**
 * Native counterpart of Dexie useLiveQuery. The query reruns when one of the
 * supplied tables changes, preserves the last successful value while refreshing,
 * and exposes first-load failures without creating unhandled rejections.
 */
export function useLive<T>(
  tables: TableName[],
  query: () => Promise<T>,
  deps: unknown[],
): LiveQueryResult<T> {
  const [state, setState] = useState<LiveQueryState<T>>({
    data: undefined,
    error: null,
    pending: true,
  })
  const [retryAttempt, setRetryAttempt] = useState(0)
  const runId = useRef(0)
  const retry = useCallback(() => setRetryAttempt((current) => current + 1), [])

  useEffect(() => {
    let alive = true
    const run = () => {
      const id = ++runId.current
      setState((previous) => ({ ...previous, error: null, pending: true }))
      void executeLiveQuery(query).then((outcome) => {
        if (!alive || id !== runId.current) return
        if (!outcome.ok) {
          setState((previous) => ({ ...previous, error: outcome.error, pending: false }))
          return
        }
        setState((previous) => ({
          data: jsonEqual(previous.data, outcome.data) ? previous.data : outcome.data,
          error: null,
          pending: false,
        }))
      })
    }
    run()
    const unsubscribe = subscribe(tables, run)
    return () => {
      alive = false
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Callers explicitly own query dependencies.
  }, [tables.join('|'), retryAttempt, ...deps])

  return {
    data: state.data,
    error: state.error,
    loading: state.pending && state.data === undefined,
    retry,
  }
}

/** Compatibility helper for consumers that can safely ignore background query failures. */
export function useLiveValue<T>(
  tables: TableName[],
  query: () => Promise<T>,
  deps: unknown[],
): T | undefined {
  return useLive(tables, query, deps).data
}
