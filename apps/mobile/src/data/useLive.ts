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
    /**
     * Every state write below returns the previous object when nothing about
     * it actually changed, so a refresh that finds the same answer costs no
     * render at all.
     *
     * This matters more than it looks. A single write notifies every table it
     * touched, every live query on those tables re-runs, and a screen that is
     * merely mounted (tabs keep theirs) re-renders with the rest. Announcing
     * "pending" and then "settled with the same data" used to be two renders
     * per subscriber per notification, for data nobody had changed.
     *
     * `pending` is therefore only raised while there is nothing to show yet:
     * it feeds `loading`, and `loading` already means "no answer so far". A
     * background refresh over data that is already on screen is not something
     * the screen has to hear about. The same reasoning keeps a stale error in
     * place until the new outcome lands, rather than blinking it away and
     * back.
     */
    const run = () => {
      const id = ++runId.current
      setState((previous) =>
        previous.data !== undefined || (previous.pending && previous.error === null)
          ? previous
          : { ...previous, error: null, pending: true },
      )
      void executeLiveQuery(query).then((outcome) => {
        if (!alive || id !== runId.current) return
        if (!outcome.ok) {
          setState((previous) =>
            previous.error === outcome.error && !previous.pending
              ? previous
              : { ...previous, error: outcome.error, pending: false },
          )
          return
        }
        setState((previous) => {
          const data = jsonEqual(previous.data, outcome.data) ? previous.data : outcome.data
          return data === previous.data && previous.error === null && !previous.pending
            ? previous
            : { data, error: null, pending: false }
        })
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
