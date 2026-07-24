import { titleForLevel, tierByKey, type LeagueTierKey } from '@afiet/core'
import { View } from 'react-native'
import { AppText } from '@/ui/AppText'

/**
 * Level badge shown next to a person: "Sofra Dostu · 12".
 *
 * The title carries the meaning and the number stays secondary, so the
 * interface never reads as a scoreboard (docs/09 invariant #2).
 */
export function LevelBadge({
  level,
  compact = false,
}: {
  level: number
  /** Number only; used where the row is already dense. */
  compact?: boolean
}) {
  return (
    <View className="self-start rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/50">
      <AppText
        weight="bold"
        numberOfLines={1}
        className="text-[11px] text-emerald-800 dark:text-emerald-200"
      >
        {compact ? `Sv ${String(level)}` : `${titleForLevel(level)} · ${String(level)}`}
      </AppText>
    </View>
  )
}

/** Tier chip: the spice emoji plus its name, optionally name-free for tight spots. */
export function TierChip({
  tier,
  showLabel = true,
}: {
  tier: LeagueTierKey
  showLabel?: boolean
}) {
  const meta = tierByKey(tier)
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
      <AppText className="text-sm">{meta.emoji}</AppText>
      {showLabel ? (
        <AppText weight="bold" className="text-[11px] text-soft">
          {meta.label}
        </AppText>
      ) : null}
    </View>
  )
}
