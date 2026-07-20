import { todayISO } from '@afiet/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { requireApi } from '@/data/api/apiHolder'
import type { WeekClosure } from './WeekCloseCelebration'
import {
  shouldCheckWeekClosure,
  WEEK_CLOSURE_RETRY_DELAY_MS,
} from './weekClosureSchedule'

/**
 * Fetches a server-authorized week celebration once per successful local day.
 * Failed checks remain eligible for a timed retry and the next foreground event.
 */
export function useWeekClosure(): { closure: WeekClosure | null; ack: () => void } {
  const [closure, setClosure] = useState<WeekClosure | null>(null)
  const lastCheckedDate = useRef<string | null>(null)
  const requestInFlight = useRef(false)
  const appIsActive = useRef(AppState.currentState === 'active')
  const mounted = useRef(true)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkRef = useRef<() => void>(() => {})

  const check = useCallback(() => {
    const date = todayISO()
    if (!shouldCheckWeekClosure(lastCheckedDate.current, date) || requestInFlight.current) return

    requestInFlight.current = true
    void Promise.resolve()
      .then(() => requireApi().weekClosure(date))
      .then((res) => {
        if (!mounted.current) return
        lastCheckedDate.current = date
        setClosure(res.closure ? { ...res.closure, totalWeeks: res.totalWeeks } : null)
      })
      .catch(() => {
        if (!mounted.current || !appIsActive.current || retryTimer.current) return
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null
          checkRef.current()
        }, WEEK_CLOSURE_RETRY_DELAY_MS)
      })
      .finally(() => {
        requestInFlight.current = false
      })
  }, [])

  useEffect(() => {
    mounted.current = true
    checkRef.current = check
    check()

    const subscription = AppState.addEventListener('change', (state) => {
      appIsActive.current = state === 'active'
      if (state === 'active') {
        check()
      } else if (retryTimer.current) {
        clearTimeout(retryTimer.current)
        retryTimer.current = null
      }
    })

    return () => {
      mounted.current = false
      subscription.remove()
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [check])

  return {
    closure,
    ack: () => {
      const weekStart = closure?.weekStart
      setClosure(null)
      if (weekStart) {
        // A failed acknowledgement may safely show the server-owned celebration again later.
        requireApi()
          .ackWeekClosure(weekStart)
          .catch(() => {})
      }
    },
  }
}
