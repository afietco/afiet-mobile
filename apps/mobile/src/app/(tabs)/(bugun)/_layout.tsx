import { Stack } from 'expo-router'

/** Bugün sekmesinin alt ekranları (beslenme, besinler, vücudum) bu stack'te — sekme çubuğu görünür kalır */
export default function BugunLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
