import { router } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconSparkles } from '@/ui/icons'
import { questSections, useQuestsResult } from './quests'

/**
 * Today board card for "Görevlerim" (half width).
 *
 * Two states: calm by default, and lit up when a quest is finished and waiting.
 * The lit state invites without pressuring; nothing here counts down, expires or
 * says the person is behind (docs/09 invariant #2).
 */

/** Soft breathing halo, used only while something is waiting to be claimed. */
function ReadyPulse() {
  const scale = useSharedValue(1)
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.35, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [scale])
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return <Animated.View style={style} className="h-2.5 w-2.5 rounded-full bg-white" />
}

export function QuestMiniCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'
  const { data: quests, loading } = useQuestsResult()
  const sections = questSections(quests ?? [])
  const ready = sections.claimable.length
  const inProgress = sections.active.length

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        ready > 0
          ? `Görevlerim, ${String(ready)} görev seni bekliyor`
          : 'Görevlerim'
      }
      onPress={() => router.push('/gorevlerim')}
      className={`flex-1 rounded-2xl p-4 active:opacity-80 ${
        ready > 0 ? 'bg-emerald-600' : 'bg-surface'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View
          className={`h-9 w-9 items-center justify-center rounded-xl ${
            ready > 0 ? 'bg-white/20' : 'bg-emerald-100 dark:bg-emerald-900/50'
          }`}
        >
          <IconSparkles size={20} color={ready > 0 ? '#ffffff' : emerald} />
        </View>
        {ready > 0 ? (
          <ReadyPulse />
        ) : (
          <IconChevronRight size={16} color={t.faint} />
        )}
      </View>

      <AppText weight="bold" className={`mt-2 ${ready > 0 ? 'text-white' : 'text-ink'}`}>
        Görevlerim
      </AppText>

      {ready > 0 ? (
        <AppText weight="semibold" numberOfLines={1} className="text-xs text-white">
          {ready} görev hazır 🎉
        </AppText>
      ) : loading ? (
        <AppText numberOfLines={1} className="text-xs text-faint">
          …
        </AppText>
      ) : inProgress > 0 ? (
        <AppText numberOfLines={1} className="text-xs text-soft">
          {inProgress} görev sürüyor
        </AppText>
      ) : (
        <AppText numberOfLines={1} className="text-xs text-soft">
          Yolculuğun burada
        </AppText>
      )}
    </Pressable>
  )
}
