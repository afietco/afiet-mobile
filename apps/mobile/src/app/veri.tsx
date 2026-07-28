import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NumbersPanel } from '@/features/body/NumbersPanel'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChart, IconChevronRight } from '@/ui/icons'

/*
 * Data screen. The content itself lives in NumbersPanel, which the "Sayılarla"
 * section of the Hedeflerim screen also hosts; this route is only the chrome
 * around it. It stays reachable because push notifications can target it
 * (features/push/push-target.ts). The screen keeps no query of its own, so the
 * panel is the single subscriber.
 */
export default function VeriScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <View className="mb-4 flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vücudum ekranına dön"
            onPress={() => router.back()}
            className="-ml-2 h-9 w-9 items-center justify-center rounded-full"
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <IconChevronRight size={20} color={t.faint} />
            </View>
          </Pressable>
          <View>
            <View className="flex-row items-center gap-2">
              <IconChart size={26} color={violet} />
              <AppText weight="extrabold" className="text-2xl text-ink">
                Veri Ekranı
              </AppText>
            </View>
            <AppText className="text-sm text-soft">Sadece bilgi amaçlı; kalori saymıyoruz 💛</AppText>
          </View>
        </View>

        <NumbersPanel />
      </ScrollView>
    </View>
  )
}
