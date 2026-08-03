/**
 * The standings row and the zone dividers, shared by the two places a table
 * appears: the three-row neighbourhood on the league screen and the full list
 * on its own page.
 *
 * The dividers are stated as facts and never as warnings, and nobody is told
 * they are behind (docs/09 invariant #2).
 */
import type { ApiLeagueRow } from '@/data/api/client'
import { View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { LevelBadge } from './LevelBadge'

export function ZoneDivider({ label }: { label: string }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <View className="my-1.5 flex-row items-center gap-2">
      <View className="h-px flex-1" style={{ backgroundColor: t.line }} />
      <AppText className="text-[10px] text-faint">{label}</AppText>
      <View className="h-px flex-1" style={{ backgroundColor: t.line }} />
    </View>
  )
}

export function LeagueRow({ row }: { row: ApiLeagueRow }) {
  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl px-2 py-2.5 ${
        row.isMe ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
      }`}
    >
      <AppText
        weight={row.isMe ? 'extrabold' : 'semibold'}
        className="w-6 text-center text-sm text-soft"
      >
        {row.rank}
      </AppText>
      <AppText className="text-xl">{row.emoji ?? '🙂'}</AppText>
      <View className="min-w-0 flex-1">
        <AppText weight={row.isMe ? 'extrabold' : 'semibold'} numberOfLines={1} className="text-ink">
          {row.isMe ? 'Sen' : row.displayName || 'afiet üyesi'}
        </AppText>
        <View className="mt-0.5 flex-row">
          <LevelBadge level={row.level} />
        </View>
      </View>
      <AppText weight="bold" className="text-sm text-ink">
        {row.score}
      </AppText>
    </View>
  )
}

/** Hairline between rows; the last row does not get one. */
export function RowSeparator() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return <View className="h-px" style={{ backgroundColor: `${t.line}66` }} />
}
