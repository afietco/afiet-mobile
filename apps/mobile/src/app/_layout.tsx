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
import { useCallback, useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AuthProvider } from '@/features/auth/AuthContext'
import { loadFtueFlags } from '@/features/ftue/ftueFlags'
import { loadInitialTheme, tokens, useTheme } from '@/theme/useTheme'

// Marka zümrütü: splash zemini ve kök görünümün açılış rengi (beyaz kare olmasın)
const SPLASH_EMERALD = '#059669'

// Splash, fontlar + kayıtlı tercihler (tema, FTUE bayrakları) hazır olana dek kalır.
// Yumuşak kapanış: ilk ekran gerçekten çizildikten sonra üzerine soluklanarak gizlenir.
SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ fade: true, duration: 300 })

export default function RootLayout() {
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

  // Splash'ı useEffect'te değil, kök görünüm gerçekten yerleşince (ilk frame
  // çizilince) gizle. Böylece splash ile içerik arasında beyaz kare kalmaz;
  // fade ile zümrüt splash doğrudan içeriğe soluklanır.
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
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}
