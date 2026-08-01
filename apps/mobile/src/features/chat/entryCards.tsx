import { router, type Href } from 'expo-router'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

/** Beslenme tab entry into the nutrition conversation. */
export function NutritionChatCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Beslenme sohbetini aç"
      onPress={() => router.push('/sohbet?asistan=beslenme' as Href)}
      className="flex-row items-center gap-3 rounded-2xl bg-surface p-4 active:bg-muted"
    >
      <AfiPose pose="kasik" size={52} />
      <View className="min-w-0 flex-1">
        <AppText weight="bold" className="text-base text-ink">
          Haftanı birlikte değerlendirelim
        </AppText>
        <AppText className="text-xs text-soft">
          Denge, öğün fikirleri, porsiyonlar: beslenme sohbeti açık.
        </AppText>
      </View>
      <IconChevronRight size={18} color={t.faint} />
    </Pressable>
  )
}

/** Quiet doorway to the destek conversation; deliberately understated. */
export function SupportChatRow() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Destek sohbetini aç"
      onPress={() => router.push('/sohbet?asistan=destek' as Href)}
      className="px-1 py-2"
    >
      <AppText className="text-center text-xs text-faint">
        Yemekle ilişkin seni zorluyorsa, konuşmak için buradayım.
      </AppText>
    </Pressable>
  )
}
