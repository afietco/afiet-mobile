import '../global.css'
import 'expo-sqlite/localStorage/install'

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito'
import * as Sentry from '@sentry/react-native'
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider, usePathname } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { getRootAuthRedirect } from '@/features/auth/root-auth-gate'
import { loadFtueFlags, useFtueSeen } from '@/features/ftue/ftueFlags'
import { loadPendingJoin } from '@/features/groups/pendingJoin'
import { PublicProfileHost } from '@/features/social/PublicProfileCard'
import { PushNotificationHost } from '@/features/push/push-notification-host'
import { WeekCloseCelebration } from '@/features/sofra/WeekCloseCelebration'
import { useWeekClosure } from '@/features/sofra/useWeekClosure'
import { useTelemetryFlush } from '@/lib/useTelemetryFlush'
import { loadInitialTheme, tokens, useTheme } from '@/theme/useTheme'
import { AppErrorBoundary } from '@/ui/AppErrorBoundary'

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN

Sentry.init({
  attachStacktrace: true,
  dsn: sentryDsn,
  enabled: !__DEV__ && Boolean(sentryDsn),
  environment: __DEV__ ? 'development' : 'production',
  sendDefaultPii: false,
})

// Brand emerald keeps the splash and root view on the same background color.
const SPLASH_EMERALD = '#059669'

// Keep the splash visible until fonts and persisted startup state are ready.
SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ fade: true, duration: 300 })

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

function AuthenticatedWeekClosureHost() {
  const { closure, ack } = useWeekClosure()
  return closure ? <WeekCloseCelebration closure={closure} onClose={ack} /> : null
}

function WeekClosureHost() {
  const { status, userId } = useAuth()
  return status === 'authed' ? <AuthenticatedWeekClosureHost key={userId ?? 'authenticated'} /> : null
}

function RootLayoutContent() {
  useTelemetryFlush()
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  })
  const [startupReady, setStartupReady] = useState(false)
  const { isDark } = useTheme()

  useEffect(() => {
    void Promise.all([loadInitialTheme(), loadFtueFlags(), loadPendingJoin()]).then(() =>
      setStartupReady(true),
    )
  }, [])

  const ready = (fontsLoaded || fontError != null) && startupReady

  // Hide the splash only after the root view has completed its first layout.
  const onLayoutRootView = useCallback(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: SPLASH_EMERALD }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <ThemeProvider value={navTheme}>
          <Stack screenOptions={{ headerShown: false }} />
          <RootAuthGate />
          <PushNotificationHost />
          <WeekClosureHost />
          {/* Global host for profiles opened through openPublicProfile(userId). */}
          <PublicProfileHost />
          <StatusBar style="auto" />
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
