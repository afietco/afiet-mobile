import '../global.css'

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito'
import * as Sentry from '@sentry/react-native'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '@/features/auth/AuthContext'
import { loadFtueFlags } from '@/features/ftue/ftueFlags'
import { PublicProfileHost } from '@/features/social/PublicProfileCard'
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

// Keep the splash visible until fonts and persisted preferences are ready.
SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ fade: true, duration: 300 })

function RootLayoutContent() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  })
  const [prefsReady, setPrefsReady] = useState(false)
  const { isDark } = useTheme()

  useEffect(() => {
    void Promise.all([loadInitialTheme(), loadFtueFlags()]).then(() => setPrefsReady(true))
  }, [])

  const ready = (fontsLoaded || fontError != null) && prefsReady

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
