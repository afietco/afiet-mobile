import AsyncStorage from '@react-native-async-storage/async-storage'
import { colorScheme, useColorScheme } from 'nativewind'
import { useCallback, useSyncExternalStore } from 'react'
import { Appearance } from 'react-native'

export type ThemePref = 'light' | 'dark' | 'system'

/** Web ile aynı anahtar; değer 'light' | 'dark', YOK = sistem (web semantiği). */
export const THEME_KEY = 'fh:theme'

/** className yetmeyen yerler için (tab bar, nav theme) token hex'leri.
    Kaynak: src/global.css; birlikte güncelle. */
export const tokens = {
  light: {
    canvas: '#f8fafc',
    surface: '#ffffff',
    muted: '#f1f5f9',
    line: '#e2e8f0',
    ink: '#1e293b',
    soft: '#64748b',
    faint: '#5f6f85',
  },
  dark: {
    canvas: '#020617',
    surface: '#0f172a',
    muted: '#1e293b',
    line: '#334155',
    ink: '#f1f5f9',
    soft: '#94a3b8',
    faint: '#8493a8',
  },
} as const

function parsePref(raw: string | null): ThemePref {
  return raw === 'light' || raw === 'dark' ? raw : 'system'
}

/* Modül seviyesi store; AsyncStorage async olduğundan tercih bir kez açılışta
   (splash gizlenmeden önce) okunur; tüm useTheme aboneleri aynı değeri paylaşır.
   Instance-başına kopya yok → geç hidrasyon yanıp sönmesi ve yazma yarışı olmaz. */
let currentPref: ThemePref = 'system'
const listeners = new Set<() => void>()

function applyPref(p: ThemePref) {
  currentPref = p
  colorScheme.set(p)
  for (const l of listeners) l()
}

/** Root layout splash gizlenmeden önce çağırır; açılışta tema flash'ı önlenir. */
export async function loadInitialTheme(): Promise<void> {
  let raw: string | null = null
  try {
    raw = await AsyncStorage.getItem(THEME_KEY)
  } catch {
    // okunamazsa sistem temasıyla devam
  }
  const p = parsePref(raw)
  if (p === 'system') {
    /* Soğuk açılış düzeltmesi. nativewind'in sistem gözlemcisi cihaz temasını
       modül yüklenirken Appearance.getColorScheme() ile bir kez tohumlar. Üretim
       yapılarında JS, iOS trait koleksiyonu hazır olmadan çalışabildiğinden bu
       ilk okuma 'light' dönebiliyor; uygulama da zaten 'active' başladığı için
       nativewind'in 'active' geçişindeki düzeltmesi hiç tetiklenmiyor ve tema
       cihaz koyu olsa dahi açık kalıyordu (Expo Go'da yok, çünkü JS zaten hazır
       bir kabukta yükleniyor). Cihazın anlık temasını RN Appearance'tan okuyup
       önce somut uygularız: bu bir görünüm-değişimi olayı doğurup gözlemciyi
       gerçek değere çeker. Hemen ardından applyPref 'system'e döndürür (native
       görünüm yeniden cihazı izler). Tümü splash arkasında olduğundan kullanıcı
       hiçbir geçiş görmez. */
    colorScheme.set(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light')
  }
  applyPref(p)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useTheme(): {
  pref: ThemePref
  setPref: (p: ThemePref) => void
  isDark: boolean
} {
  const pref = useSyncExternalStore(subscribe, () => currentPref)
  const { colorScheme: scheme } = useColorScheme()

  const setPref = useCallback((p: ThemePref) => {
    applyPref(p)
    if (p === 'system') void AsyncStorage.removeItem(THEME_KEY)
    else void AsyncStorage.setItem(THEME_KEY, p)
  }, [])

  return { pref, setPref, isDark: scheme === 'dark' }
}
