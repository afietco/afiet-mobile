import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '@/ui/AppText'

/** Faz 8: web'deki FoodsPage (besin rehberi) buraya taşınacak */
export default function BesinlerScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-canvas px-4" style={{ paddingTop: insets.top + 16 }}>
      <Pressable onPress={() => router.back()} hitSlop={8} className="self-start">
        <AppText weight="semibold" className="text-emerald-600">
          ← Geri
        </AppText>
      </Pressable>
      <AppText weight="extrabold" className="mt-4 text-2xl text-ink">
        Besin Rehberi
      </AppText>
      <AppText className="mt-2 text-soft">
        Bu ekran mobilde yakında — web'deki hali referans.
      </AppText>
      <AppText className="mt-1 text-xs text-faint">Faz 8</AppText>
    </View>
  )
}
