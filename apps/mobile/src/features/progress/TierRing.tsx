import type { LeagueTierKey } from '@afiet/core'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

/**
 * A person in the standings: their face inside a ring, with their level on it.
 *
 * The geometry is MemberRing's, so a face in the league reads as the same kind
 * of thing as a face in a group. What differs is what the ring means. A group
 * ring fills with the day's energy; this one is closed, and it carries the
 * colour of the sofra everybody in the table is sitting at.
 *
 * It is closed on purpose rather than for now. Filling it would mean showing
 * how far somebody is through their level, and the standings row carries this
 * month's points, not a lifetime total: the arc would be drawn from a number
 * that does not mean that. When the server sends the ratio, this is the ring
 * that starts moving, and nothing else has to change.
 */

const R = 15.5

/**
 * One colour per tier, lifted from the spice each one is drawn from
 * (ui/maskot/spices). Tuz keeps its warm stone, safran its gold. Deliberately
 * not a metal ladder: the tiers are a kitchen, not a podium.
 */
const TIER_COLOR: Record<LeagueTierKey, [string, string]> = {
  tuz: ['#a1937a', '#d9cdb4'],
  nane: ['#059669', '#34d399'],
  kekik: ['#65a30d', '#84cc16'],
  sumak: ['#be123c', '#fb7185'],
  safran: ['#d97706', '#fbbf24'],
}

export function TierRing({
  emoji,
  level,
  tier,
  size = 44,
}: {
  emoji: string | null
  level: number
  tier: LeagueTierKey
  size?: number
}) {
  const { isDark } = useTheme()
  const stroke = TIER_COLOR[tier][isDark ? 1 : 0]

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Circle cx={18} cy={18} r={R} fill="none" strokeWidth={2.6} stroke={stroke} />
      </Svg>
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <AppText style={{ fontSize: Math.round(size * 0.42) }}>{emoji ?? '🙂'}</AppText>
      </View>
      {/* The level sits on the ring rather than under the name: the name's line
          belongs to who somebody is with, not to a number. */}
      <View
        className="absolute -bottom-0.5 -right-1 rounded-full border border-canvas px-1"
        style={{ backgroundColor: stroke }}
      >
        <AppText weight="extrabold" className="text-[10px] text-white">
          {level}
        </AppText>
      </View>
    </View>
  )
}
