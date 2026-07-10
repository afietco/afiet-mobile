import '../global.css'

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { loadInitialTheme, tokens, useTheme } from '@/theme/useTheme'

// Splash, fontlar + kayıtlı tema tercihi hazır olana dek kalır (tema flaşı önlenir)
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  })
  const [themeReady, setThemeReady] = useState(false)
  const { isDark } = useTheme()

  useEffect(() => {
    loadInitialTheme().then(() => setThemeReady(true))
  }, [])

  const ready = (fontsLoaded || fontError != null) && themeReady

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
