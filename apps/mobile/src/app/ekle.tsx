import { Redirect, useLocalSearchParams } from 'expo-router'
import { setPendingAdd } from '@/features/widget/pendingAdd'

/**
 * afiet://ekle?ogun=<meal> — widget'ın derin bağlantısı. Öğünü köprüye
 * bırakıp Bugün'e yönlendirir; sheet'i Bugün açar (kayıt akışının sahibi o).
 */
export default function EkleRoute() {
  const { ogun } = useLocalSearchParams<{ ogun?: string }>()
  setPendingAdd(typeof ogun === 'string' ? ogun : undefined)
  return <Redirect href="/(tabs)/(bugun)" />
}
