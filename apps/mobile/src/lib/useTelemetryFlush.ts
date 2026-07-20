import { useEffect } from 'react'
import { AppState } from 'react-native'
import { flushTelemetry } from './track'

/** Flushes short-session events before the app becomes inactive or backgrounded. */
export function useTelemetryFlush(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void flushTelemetry()
    })
    return () => subscription.remove()
  }, [])
}
