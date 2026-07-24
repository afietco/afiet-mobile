import { tierByKey, type LeagueTierKey } from '@afiet/core'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { useLeagueResult } from './useProgress'

/**
 * Today board card for the league (half width): which table I am sitting at and
 * where I stand this month. It states position as a fact and never frames it as
 * falling behind (docs/09 invariant #2).
 */
export function LeagueMiniCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { data: league, loading } = useLeagueResult()
  const tier = tierByKey((league?.tier ?? 'tuz') as LeagueTierKey)

  // Sitting out (a fresh account, or the league not open yet) is a normal
  // state, not an error: the card still invites without promising a rank.
  const subtitle = loading
    ? '…'
    : league?.seated
      ? `${tier.label} · ${String(league.myRank)}. sıra`
      : 'Yakında sofran kurulur'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        league?.seated
          ? `Ligim: ${tier.label} sofrası, ${String(league.myRank)}. sıradasın`
          : 'Ligim'
      }
      onPress={() => router.push('/lig')}
      className="flex-1 rounded-2xl bg-surface p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
          <Text style={{ fontSize: 18, lineHeight: 24 }}>{tier.emoji}</Text>
        </View>
        <IconChevronRight size={16} color={t.faint} />
      </View>
      <AppText weight="bold" className="mt-2 text-ink">
        Ligim
      </AppText>
      <AppText numberOfLines={1} className="text-xs text-soft">
        {subtitle}
      </AppText>
    </Pressable>
  )
}
