import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import {
  checkServiceStatus,
  resetServiceStatus,
  type ServiceStatus,
} from './serviceStatus'

/**
 * What a failure screen should say, and when to try again on its own.
 *
 * Two things every "could not connect" screen was missing. It could not tell
 * the person whether the fault was ours, and it never retried by itself: once
 * a screen had failed it stayed failed until it was tapped, so an app left
 * open through an outage still showed the error long after the service came
 * back. Coming back to the app is the natural moment to find out, and it is
 * free, so that is when both happen.
 */

export interface OutageNotice {
  /** Null until the status page has answered; screens keep their own copy. */
  status: ServiceStatus | null
}

export function useOutageNotice(failed: boolean, onRetry?: () => void): OutageNotice {
  const [status, setStatus] = useState<ServiceStatus | null>(null)

  useEffect(() => {
    if (!failed) {
      setStatus(null)
      return
    }
    let cancelled = false
    void checkServiceStatus().then((value) => {
      if (!cancelled) setStatus(value)
    })
    return () => {
      cancelled = true
    }
  }, [failed])

  useEffect(() => {
    if (!failed || !onRetry) return
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return
      /* The cached verdict is from before this trip to the background, and the
         whole point of coming back is that something may have changed. */
      resetServiceStatus()
      onRetry()
    })
    return () => subscription.remove()
  }, [failed, onRetry])

  return { status }
}
