import { levelProgress, type LeagueTierKey } from '@afiet/core'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

/**
 * A person in the standings: their face inside a ring, with their level on it.
 *
 * The geometry is MemberRing's, so a face in the league reads as the same kind
 * of thing as a face in a group. What differs is what the ring means and what
 * colour it is: a group ring fills with the day's energy, this one fills with
 * the level and wears the colour of the sofra the whole table is sitting at.
 *
 * The arc fills toward the next level, from the LIFETIME total the row carries
 * (`totalXp`) and never from `score`, which is this month alone: an arc drawn
 * from the month would show something other than what it claims. The curve is
 * `levelProgress` in @afiet/core, the same one the person's own ring uses, so
 * the two can never drift apart.
 */

const R = 15.5

/**
 * One colour per tier, lifted from the spice each one is drawn from
 * (ui/maskot/spices). Tuz keeps its warm stone, safran its gold. Deliberately
 * not a metal ladder: the tiers are a kitchen, not a podium.
 *
 * Exported because the ladder is explained in two places and they have to agree
 * on what a tier looks like: the ring in the standings and the five cards on the
 * guide page.
 */
export const TIER_COLOR: Record<LeagueTierKey, [string, string]> = {
  tuz: ['#a1937a', '#d9cdb4'],
  nane: ['#059669', '#34d399'],
  kekik: ['#65a30d', '#84cc16'],
  sumak: ['#be123c', '#fb7185'],
  safran: ['#d97706', '#fbbf24'],
}

/** The tier's own colour for the current theme. */
export function tierColor(tier: LeagueTierKey, isDark: boolean): string {
  return TIER_COLOR[tier][isDark ? 1 : 0]
}

const C = 2 * Math.PI * R

export function TierRing({
  emoji,
  level,
  totalXp,
  tier,
  size = 44,
}: {
  emoji: string | null
  level: number
  /** Lifetime experience. The arc is drawn from this, never from the month. */
  totalXp: number
  tier: LeagueTierKey
  size?: number
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const stroke = tierColor(tier, isDark)
  const ratio = Math.min(1, Math.max(0, levelProgress(totalXp).ratio))

  return (
    <View style={{ width: size, height: size }}>
      {/* Rotated so the arc starts at twelve o'clock rather than at three. */}
      <Svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={18} cy={18} r={R} fill="none" strokeWidth={2.6} stroke={t.muted} />
        <Circle
          cx={18}
          cy={18}
          r={R}
          fill="none"
          strokeWidth={2.6}
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={`${C} ${C}`}
          strokeDashoffset={C - ratio * C}
        />
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
