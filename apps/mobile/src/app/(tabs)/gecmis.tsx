import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '@/ui/AppText'

/** Faz 8: web'deki HistoryPage buraya taşınacak */
export default function GecmisScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-canvas px-4" style={{ paddingTop: insets.top + 16 }}>
      <AppText weight="extrabold" className="text-2xl text-ink">
        Geçmiş
      </AppText>
      <AppText className="mt-2 text-soft">
        Bu ekran mobilde yakında — web'deki hali referans.
      </AppText>
      <AppText className="mt-1 text-xs text-faint">Faz 8</AppText>
    </View>
  )
}
