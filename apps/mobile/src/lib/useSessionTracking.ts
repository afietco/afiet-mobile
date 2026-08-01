import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { usePathname } from 'expo-router'
import { useEffect, useRef } from 'react'
import { AppState, Platform } from 'react-native'
import {
  consumeLaunchFromNotification,
  currentSid,
  rotateSid,
  TELEMETRY_SESSION_STORAGE_KEY,
} from './telemetrySession'
import { flushTelemetry, persistTelemetryQueue, track } from './track'

/**
 * Session lifecycle + screen journey telemetry.
 *
 * A session starts when the process comes up and ends when the app stays in
 * the background longer than the resume window (or is killed there). The end
 * of a killed session is written retroactively on the next launch from the
 * heartbeat persisted here, which is why events carry their own `ts`.
 *
 * Screen visits are emitted on exit, when their duration is known: one
 * `screen_view` per dwell with the screen, where the person came from, and
 * seconds spent. Backgrounding closes the current dwell; returning inside the
 * resume window opens a fresh dwell on the same screen, so a screen re-entered
 * around a backgrounding counts twice in open-counts by design.
 *
 * All lifecycle state is module-level on purpose: the host component can be
 * remounted by the error boundary's "try again" path, and a remount must
 * neither re-read the heartbeat (it now describes the LIVE session, and
 * closing it would corrupt exactly the post-crash sessions worth reading)
 * nor restart the clock.
 */

/** Background gaps shorter than this resume the same session. */
const SESSION_RESUME_MS = 5 * 60 * 1000

interface PersistedSession {
  sid: string
  startedAt: number
  lastActiveAt: number
}

interface ScreenVisit {
  screen: string
  from: string | null
  enteredAt: number
}

/** First path segment names the screen; the tab index route is "bugun". */
export function screenFromPathname(pathname: string): string {
  const [first] = pathname.replace(/^\/+/, '').split('/')
  return first === '' || first === 'index' ? 'bugun' : first
}

let lifecycleClaimed = false
let sessionStartedAt = Date.now()
let backgroundAt: number | null = null
let suspendedFrom: string | null = null
let visit: ScreenVisit | null = null

function persistSession(lastActiveAt: number): void {
  const record: PersistedSession = {
    sid: currentSid(),
    startedAt: sessionStartedAt,
    lastActiveAt,
  }
  void AsyncStorage.setItem(TELEMETRY_SESSION_STORAGE_KEY, JSON.stringify(record)).catch(() => {
    // A missed heartbeat only shortens the retroactive session_end.
  })
}

function durationSec(from: number, to: number): number {
  return Math.max(0, Math.round((to - from) / 1000))
}

function closeVisit(at: number): void {
  const current = visit
  if (!current) return
  visit = null
  track('screen_view', {
    screen: current.screen,
    from: current.from ?? undefined,
    duration_sec: durationSec(current.enteredAt, at),
    ts: current.enteredAt,
  })
}

export function useSessionTracking(): void {
  const pathname = usePathname()
  const screen = screenFromPathname(pathname)

  const screenRef = useRef(screen)
  screenRef.current = screen

  useEffect(() => {
    const startSession = (at: number) => {
      sessionStartedAt = at
      track('session_start', {
        ts: at,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version ?? 'unknown',
        from_notification: consumeLaunchFromNotification(),
      })
      persistSession(at)
      visit = { screen: screenRef.current, from: null, enteredAt: at }
    }

    if (!lifecycleClaimed) {
      lifecycleClaimed = true
      // Close the session a previous run left open (process killed in the
      // background), then start this run's session under the module-level sid
      // that early events already carry.
      void AsyncStorage.getItem(TELEMETRY_SESSION_STORAGE_KEY)
        .then((raw) => {
          if (raw) {
            try {
              const prev = JSON.parse(raw) as PersistedSession
              track('session_end', {
                sid: prev.sid,
                ts: prev.lastActiveAt,
                duration_sec: durationSec(prev.startedAt, prev.lastActiveAt),
              })
            } catch {
              // A corrupt record leaves nothing to close.
            }
          }
        })
        .catch(() => undefined)
        .then(() => startSession(Date.now()))
    } else if (!visit) {
      // Error-boundary remount mid-session: same session continues, only the
      // current dwell restarts.
      visit = { screen: screenRef.current, from: null, enteredAt: Date.now() }
    }

    const subscription = AppState.addEventListener('change', (state) => {
      const now = Date.now()
      if (state !== 'active') {
        // iOS fires 'inactive' then 'background'; act once per suspension.
        if (backgroundAt !== null) return
        backgroundAt = now
        suspendedFrom = visit?.from ?? null
        closeVisit(now)
        persistSession(now)
        // Persist first: the flush may be skipped (one already in flight) or
        // interrupted, and iOS can kill a backgrounded app before any timer.
        void persistTelemetryQueue()
        void flushTelemetry()
        return
      }
      const suspendedAt = backgroundAt
      backgroundAt = null
      if (suspendedAt === null) return
      if (now - suspendedAt > SESSION_RESUME_MS) {
        // The session ended when the app went to the background.
        track('session_end', {
          ts: suspendedAt,
          duration_sec: durationSec(sessionStartedAt, suspendedAt),
        })
        rotateSid()
        startSession(now)
      } else {
        visit = { screen: screenRef.current, from: suspendedFrom, enteredAt: now }
        persistSession(now)
      }
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    const current = visit
    if (!current || current.screen === screen) return
    const now = Date.now()
    track('screen_view', {
      screen: current.screen,
      from: current.from ?? undefined,
      duration_sec: durationSec(current.enteredAt, now),
      ts: current.enteredAt,
    })
    visit = { screen, from: current.screen, enteredAt: now }
    // Heartbeat: a crash mid-session still gets a fair retroactive duration.
    persistSession(now)
  }, [screen])
}

/** Mount once in the root layout, after PushNotificationHost so a cold start
    from a notification can mark the flag before session_start is emitted. */
export function SessionTrackingHost(): null {
  useSessionTracking()
  return null
}
