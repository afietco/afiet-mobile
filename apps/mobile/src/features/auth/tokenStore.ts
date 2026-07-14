/**
 * Token kalıcılığı. Şimdilik AsyncStorage — sadeleştirilmiş; sertleştirme
 * adımı olarak expo-secure-store'a taşınabilir (refresh token için ideal).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS = 'fh:auth:access'
const REFRESH = 'fh:auth:refresh'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
}

export async function saveTokens(t: StoredTokens): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS, t.accessToken],
    [REFRESH, t.refreshToken],
  ])
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const pairs = await AsyncStorage.multiGet([ACCESS, REFRESH])
  const access = pairs.find(([k]) => k === ACCESS)?.[1]
  const refresh = pairs.find(([k]) => k === REFRESH)?.[1]
  if (!access || !refresh) return null
  return { accessToken: access, refreshToken: refresh }
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS, REFRESH])
}
