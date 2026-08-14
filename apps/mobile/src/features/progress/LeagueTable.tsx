/**
 * The standings row and the zone dividers, shared by the two places a table
 * appears: the three-row neighbourhood on the league screen and the full list
 * on its own page.
 *
 * The dividers are stated as facts and never as warnings, and nobody is told
 * they are behind (docs/09 invariant #2).
 *
 * A row is a person, so it opens that person: their public profile, where they
 * can be added as a friend. The card is a single global sheet
 * (social/PublicProfileCard), so a row only has to name who it is about.
 */
import type { LeagueTierKey } from '@afiet/core'
import { Pressable, View } from 'react-native'
import type { ApiLeagueRow } from '@/data/api/client'
import { openPublicProfile } from '@/features/social/PublicProfileCard'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { TierRing } from './TierRing'

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

export function LeagueRow({ row, tier }: { row: ApiLeagueRow; tier: LeagueTierKey }) {
  const name = row.isMe ? 'Sen' : row.displayName || 'afiet üyesi'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${row.rank}. sıra, ${row.score} puan${
        row.groupName ? `, ${row.groupName} grubundan` : ''
      }. Profilini aç`}
      onPress={() => {
        trackTap('lig_profile_open')
        openPublicProfile(row.userId)
      }}
      className={`flex-row items-center gap-3 rounded-xl px-2 py-2.5 active:bg-muted ${
        row.isMe ? 'bg-emerald-50 dark:bg-emerald-950/40' : ''
      }`}
    >
      <AppText
        weight={row.isMe ? 'extrabold' : 'semibold'}
        className="w-6 text-center text-sm text-soft"
      >
        {row.rank}
      </AppText>
      <TierRing emoji={row.emoji} level={row.level} totalXp={row.totalXp} tier={tier} />
      <View className="min-w-0 flex-1">
        <AppText weight={row.isMe ? 'extrabold' : 'semibold'} numberOfLines={1} className="text-ink">
          {name}
        </AppText>
        {/* Who they eat with, where the level badge used to be. Somebody with
            no group gets no second line rather than an empty one: "grubu yok"
            is not information, it is a gap dressed up as one. */}
        {row.groupName ? (
          <AppText numberOfLines={1} className="text-xs text-soft">
            🍲 {row.groupName}
          </AppText>
        ) : null}
      </View>
      <AppText weight="bold" className="text-sm text-ink">
        {row.score}
      </AppText>
    </Pressable>
  )
}

/** Hairline between rows; the last row does not get one. */
export function RowSeparator() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return <View className="h-px" style={{ backgroundColor: `${t.line}66` }} />
}
