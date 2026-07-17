/**
 * Token kalıcılığı: expo-secure-store (Keychain / Keystore). Refresh token
 * gibi uzun ömürlü sırlar düz AsyncStorage yerine güvenli depoda tutulur.
 *
 * SecureStore anahtarlarında ':' geçersizdir; bu yüzden noktalı anahtarlar
 * kullanılır. Eski sürümler token'ı AsyncStorage'da 'fh:auth:*' altında
 * tutuyordu; ilk yüklemede bir kezlik sessiz migrasyon yapılır ki güncelleme
 * yapan (TestFlight) kullanıcı oturumdan düşmesin.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

const ACCESS = 'fh.auth.access'
const REFRESH = 'fh.auth.refresh'

// Eski AsyncStorage anahtarları (yalnızca migrasyon için).
const LEGACY_ACCESS = 'fh:auth:access'
const LEGACY_REFRESH = 'fh:auth:refresh'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
}

export async function saveTokens(t: StoredTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS, t.accessToken),
    SecureStore.setItemAsync(REFRESH, t.refreshToken),
  ])
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS),
    SecureStore.getItemAsync(REFRESH),
  ])
  if (access && refresh) return { accessToken: access, refreshToken: refresh }
  // SecureStore boş: eski AsyncStorage oturumu varsa bir kez taşı.
  return migrateFromAsyncStorage()
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS),
    SecureStore.deleteItemAsync(REFRESH),
  ])
}

/** Eski AsyncStorage token'larını SecureStore'a taşır ve eskilerini siler.
    Değer yoksa ya da taşıma başarısızsa null döner (temiz açılış). */
async function migrateFromAsyncStorage(): Promise<StoredTokens | null> {
  try {
    const pairs = await AsyncStorage.multiGet([LEGACY_ACCESS, LEGACY_REFRESH])
    const access = pairs.find(([k]) => k === LEGACY_ACCESS)?.[1]
    const refresh = pairs.find(([k]) => k === LEGACY_REFRESH)?.[1]
    if (!access || !refresh) return null
    await saveTokens({ accessToken: access, refreshToken: refresh })
    await AsyncStorage.multiRemove([LEGACY_ACCESS, LEGACY_REFRESH])
    return { accessToken: access, refreshToken: refresh }
  } catch {
    // Migrasyon başarısızsa oturumu düşürmek yerine sessizce anon'a düşülür.
    return null
  }
}
