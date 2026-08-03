import { tierAbove, tierBelow, type LeagueTierKey } from '@afiet/core'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LeagueRow, RowSeparator, ZoneDivider } from '@/features/progress/LeagueTable'
import { useLeagueResult } from '@/features/progress/useProgress'
import { AppText } from '@/ui/AppText'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/**
 * The whole sofra, on its own page.
 *
 * It used to be the bottom two thirds of the league screen, where twenty-five
 * rows of mostly zeroes buried everything that explained the ladder. The
 * league screen now shows the neighbourhood and points here; this is for the
 * moment somebody actually wants to read the table.
 */
export default function LeagueStandingsScreen() {
  const insets = useSafeAreaInsets()
  const { data: league, loading, error, retry } = useLeagueResult()

  if (loading || !league) return <PageSkeleton error={error} onRetry={retry} />

  const above = tierAbove(league.tier as LeagueTierKey)
  const below = tierBelow(league.tier as LeagueTierKey)
  const aboveLabel = above?.label ?? ''
  const belowLabel = below?.label ?? ''
  const size = league.rows.length

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader title="Sofran" subtitle={`${size} kişi · bu ayın sıralaması`} />

        <View className="rounded-2xl bg-surface p-3">
          {league.rows.map((row, index) => (
            <View key={row.userId}>
              {row.rank === 1 && league.promote > 0 ? (
                <ZoneDivider label={`${aboveLabel} sofrasına geçer`} />
              ) : null}
              {row.rank === league.promote + 1 && league.promote > 0 ? (
                <ZoneDivider label="burada kalır" />
              ) : null}
              {league.demote > 0 && row.rank === size - league.demote + 1 ? (
                <ZoneDivider label={`${belowLabel} sofrasında devam eder`} />
              ) : null}
              <LeagueRow row={row} />
              {index < size - 1 ? <RowSeparator /> : null}
            </View>
          ))}
        </View>

        <AppText className="mt-4 text-center text-xs text-faint">
          Sofran her ayın 1'inde yeniden kurulur.
        </AppText>
      </ScrollView>
    </View>
  )
}
