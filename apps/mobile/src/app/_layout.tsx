import '../global.css'
import 'expo-sqlite/localStorage/install'

import * as Sentry from '@sentry/react-native'
import { useFonts } from 'expo-font'
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider, usePathname } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { PremiumProvider } from '@/features/premium/usePremium'
import { getRootAuthRedirect } from '@/features/auth/root-auth-gate'
import { loadFtueFlags, useFtueSeen } from '@/features/ftue/ftueFlags'
import { loadPendingJoin } from '@/features/groups/pendingJoin'
import { LevelUpCelebration } from '@/features/progress/LevelUpCelebration'
import { useLevelUp } from '@/features/progress/useLevelUp'
import { PublicProfileHost } from '@/features/social/PublicProfileCard'
import { PushNotificationHost } from '@/features/push/push-notification-host'
import { WeekCloseCelebration } from '@/features/sofra/WeekCloseCelebration'
import { maybeAskForReview } from '@/features/review/storeReview'
import { useWeekClosure } from '@/features/sofra/useWeekClosure'
import { UpdateRequiredScreen } from '@/features/update/UpdateRequiredScreen'
import { useUpdateVerdict } from '@/features/update/useUpdateVerdict'
import {
  currentAppVersion,
  hydrateVersionGate,
  refreshVersionGate,
} from '@/features/update/versionGate'
import { SessionTrackingHost } from '@/lib/useSessionTracking'
import { useTelemetryFlush } from '@/lib/useTelemetryFlush'
import { track } from '@/lib/track'
import { needsRuntimeFonts } from '@/theme/fonts'
import { runtimeFonts } from '@/theme/runtimeFonts'
import { loadInitialTheme, tokens, useTheme } from '@/theme/useTheme'
import { AppErrorBoundary } from '@/ui/AppErrorBoundary'
import { OverlayHost } from '@/ui/overlayHost'

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN
// Set per EAS build profile so dev/staging/production crashes stay separable in Sentry.
const sentryEnvironment = process.env.EXPO_PUBLIC_SENTRY_ENV ?? 'production'

Sentry.init({
  attachStacktrace: true,
  dsn: sentryDsn,
  enabled: !__DEV__ && Boolean(sentryDsn),
  environment: __DEV__ ? 'development' : sentryEnvironment,
  sendDefaultPii: false,
})

/** Start of this module's evaluation; the earliest moment JS can observe. */
const JS_START = Date.now()

// Brand emerald keeps the splash and root view on the same background color.
const SPLASH_EMERALD = '#059669'

/**
 * How long the splash is allowed to wait on the session before giving up.
 *
 * Restoring a session is a Keychain read plus two storage reads and normally
 * takes a few dozen milliseconds. The ceiling exists only so a device that
 * somehow never answers shows the app instead of a green screen forever.
 */
const SESSION_WAIT_CEILING_MS = 3_000

// Keep the splash visible until fonts and persisted startup state are ready.
SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ fade: true, duration: 300 })

/**
 * Fonts, where they are not already compiled in.
 *
 * Native builds embed Nunito through the expo-font config plugin, so there is
 * nothing to fetch and nothing to wait for: this resolves on the first render
 * and the splash is never held for a font again. Expo Go and the web preview
 * have no embedded copy and load the same four files at runtime, exactly as
 * the whole app used to.
 */
const startupFonts = needsRuntimeFonts ? runtimeFonts : {}

function RootAuthGate() {
  const pathname = usePathname()
  const { status, sessionEndReason } = useAuth()
  const welcomeIntroSeen = useFtueSeen('welcomeIntro')
  const firstValueCaptured = useFtueSeen('firstValueCaptured')
  const destination = getRootAuthRedirect({
    status,
    sessionExpired: sessionEndReason === 'expired',
    pathname,
    welcomeIntroSeen,
    firstValueCaptured,
  })

  return destination ? <Redirect href={destination} /> : null
}

/**
 * Celebration queue for a signed-in person. Both moments are server-driven and
 * may become due in the same second, so they are ordered here instead of
 * stacking two modals: the week closes first, the level scene waits its turn.
 */
function AuthenticatedWeekClosureHost({ accountId }: { accountId: string | null }) {
  const { closure, ack } = useWeekClosure()
  const { event: levelUp, ack: ackLevelUp } = useLevelUp(accountId)
  /* Weeks of the celebration that was just closed, held until the queue is
     empty. The store draws its review dialog on top of whatever is on screen,
     so asking the moment the week scene closes could land it over the level
     scene waiting behind it. */
  const [weeksPendingReview, setWeeksPendingReview] = useState<number | null>(null)

  useEffect(() => {
    if (weeksPendingReview === null || closure || levelUp) return
    setWeeksPendingReview(null)
    void maybeAskForReview(weeksPendingReview)
  }, [weeksPendingReview, closure, levelUp])

  if (closure) {
    const weeks = closure.totalWeeks
    return (
      <WeekCloseCelebration
        closure={closure}
        onClose={() => {
          ack()
          setWeeksPendingReview(weeks)
        }}
      />
    )
  }
  return levelUp ? <LevelUpCelebration event={levelUp} onClose={ackLevelUp} /> : null
}

function WeekClosureHost() {
  const { status, userId } = useAuth()
  return status === 'authed' ? (
    <AuthenticatedWeekClosureHost key={userId ?? 'authenticated'} accountId={userId} />
  ) : null
}

/**
 * Decides when the splash comes down, and reports how long it took.
 *
 * It used to come down as soon as fonts and preferences were ready, which is
 * before the session has been restored, so a launch read splash → skeleton →
 * content. Now that the persisted response snapshot paints real data the
 * moment the session binds, that middle step is pure flicker: waiting the few
 * dozen milliseconds the session takes turns the launch into splash → content.
 */
function SplashGate({ laidOut }: { laidOut: boolean }) {
  const { status } = useAuth()
  const [waitedLongEnough, setWaitedLongEnough] = useState(false)
  const hidden = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => setWaitedLongEnough(true), SESSION_WAIT_CEILING_MS)
    return () => clearTimeout(timer)
  }, [])

  const sessionSettled = status !== 'loading'

  useEffect(() => {
    if (hidden.current || !laidOut || !(sessionSettled || waitedLongEnough)) return
    hidden.current = true
    void SplashScreen.hideAsync()
    track('cold_start', {
      duration_ms: Date.now() - JS_START,
      /* Both flags are what the number has to be read against: a runtime font
         load and a session that timed out are the two things that make a
         launch slow for reasons that say nothing about the device. */
      runtime_fonts: needsRuntimeFonts,
      session_settled: sessionSettled,
      app_version: currentAppVersion() ?? 'unknown',
    })
  }, [laidOut, sessionSettled, waitedLongEnough])

  return null
}

function RootLayoutContent() {
  useTelemetryFlush()
  const [fontsLoaded, fontError] = useFonts(startupFonts)
  const [startupReady, setStartupReady] = useState(false)
  const [laidOut, setLaidOut] = useState(false)
  const { isDark } = useTheme()
  const update = useUpdateVerdict()

  useEffect(() => {
    void Promise.all([
      loadInitialTheme(),
      loadFtueFlags(),
      loadPendingJoin(),
      /* Read from disk with the rest of the persisted startup state: the
         verdict has to be decidable on the first render, or a build that is
         no longer allowed to run would get a frame of the real app first. */
      hydrateVersionGate(),
    ]).then(() => setStartupReady(true))
  }, [])

  /* Asking afiet.co what the stores have is a background errand, never a gate.
     It runs once on launch and again whenever the app comes back, because an
     update can be published while somebody keeps the app open for days. */
  useEffect(() => {
    void refreshVersionGate()
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refreshVersionGate()
    })
    return () => subscription.remove()
  }, [])

  const ready = (fontsLoaded || fontError != null) && startupReady

  const onLayoutRootView = useCallback(() => setLaidOut(true), [])

  if (!ready) return null

  const t = tokens[isDark ? 'dark' : 'light']
  const base = isDark ? DarkTheme : DefaultTheme
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: '#059669',
      background: t.canvas,
      card: t.surface,
      text: t.ink,
      border: t.line,
    },
  }

  /* A build below the minimum gets the wall INSTEAD of the app, not over it:
     mounting the navigator would start every screen behind it querying an API
     this build is no longer allowed to talk to. Nothing on that screen needs a
     session, so the auth provider stays unmounted too. */
  if (update.kind === 'required') {
    return (
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: SPLASH_EMERALD }}
        onLayout={() => void SplashScreen.hideAsync()}
      >
        <SafeAreaProvider>
          <ThemeProvider value={navTheme}>
            <UpdateRequiredScreen
              version={update.version}
              currentVersion={currentAppVersion()}
              storeUrl={update.storeUrl}
              message={update.message}
            />
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: SPLASH_EMERALD }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <ThemeProvider value={navTheme}>
          {/* Inside auth, because who is subscribed is a fact about the account
              rather than the device, and every gate that reads it sits below. */}
          <PremiumProvider>
          {/* Every popup in the app is drawn above this, in one layer over the
              navigator and the tab bar. Inside the providers, so a popup reads
              the same auth, theme and gestures as the screen that opened it. */}
          <OverlayHost>
            <SplashGate laidOut={laidOut} />
            <Stack screenOptions={{ headerShown: false }} />
            <RootAuthGate />
            <PushNotificationHost />
            {/* After PushNotificationHost: sibling effects run in tree order,
                so a notification cold start is flagged before session_start. */}
            <SessionTrackingHost />
            <WeekClosureHost />
            {/* Global host for profiles opened through openPublicProfile(userId). */}
            <PublicProfileHost />
            <StatusBar style="auto" />
          </OverlayHost>
          </PremiumProvider>
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

function RootLayout() {
  return (
    <AppErrorBoundary>
      <RootLayoutContent />
    </AppErrorBoundary>
  )
}

export default Sentry.wrap(RootLayout)
