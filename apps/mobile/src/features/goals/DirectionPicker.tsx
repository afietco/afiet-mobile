import { GOAL_DIRECTIONS, formatLongTR, type GoalDirection } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { Pressable, View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import type { PendingGoalDirection } from './goalDirection'

/**
 * "Yönüm": the five directions a person can point their measures at.
 *
 * The sentences come from the engine's direction table verbatim. They describe
 * how someone wants to feel and never name weight, so this screen quotes them
 * rather than rewording them.
 *
 * A choice never lands today. The line under the list always names the Monday
 * it starts on, so the list can be tapped freely without the measures above it
 * appearing to change under the finger.
 */

export interface DirectionPickerProps {
  /** The direction in force today. */
  active: GoalDirection
  /** True while `active` is the silent default and nothing has been chosen. */
  isDefault: boolean
  /** A choice waiting for its Monday, or null. */
  pending: PendingGoalDirection | null
  /** The Monday a choice made today would start on (YYYY-MM-DD). */
  startsOn: string
  onSelect: (direction: GoalDirection) => void
  /** Locks the list while a choice is being stored. */
  busy?: boolean
  /** Shown when the last choice could not be stored. */
  error?: string | null
}

export function DirectionPicker({
  active,
  isDefault,
  pending,
  startsOn,
  onSelect,
  busy = false,
  error = null,
}: DirectionPickerProps) {
  const { isDark } = useTheme()
  const violet = isDark ? '#a78bfa' : '#7c3aed'

  // The latest choice is what the list shows as chosen, even before it starts.
  // Someone who has never chosen sees no filled circle: the default direction
  // is real, but it is ours, not theirs, and the list should not claim it is.
  const selected: GoalDirection | null = pending?.direction ?? (isDefault ? null : active)

  const note = pending
    ? `${formatLongTR(pending.effectiveFrom)}'den geçerli. O güne kadar şimdiki yönün sürüyor.`
    : isDefault
      ? `Bir yön seçersen ${formatLongTR(startsOn)}'den geçerli olur.`
      : `Bu yön şu an geçerli. Değiştirirsen ${formatLongTR(startsOn)}'den başlar.`

  return (
    <View className="rounded-2xl bg-surface p-4">
      <AppText weight="bold" className="text-xs tracking-wide text-faint">
        YÖNÜM
      </AppText>
      <AppText className="mt-1 text-sm text-soft">
        Ölçülerini neye göre kuracağımı sen söyle 🌿
      </AppText>

      <View accessibilityRole="radiogroup" className="mt-3 gap-2">
        {GOAL_DIRECTIONS.map((option) => {
          const isSelected = selected === option.key
          return (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: busy }}
              disabled={busy}
              onPress={() => {
                if (option.key === selected) return
                void Haptics.selectionAsync()
                onSelect(option.key)
              }}
              className={`flex-row items-center gap-3 rounded-xl border px-3.5 py-3 ${
                isSelected
                  ? 'border-violet-500 bg-violet-50 dark:border-violet-400 dark:bg-violet-950/50'
                  : 'border-line bg-surface'
              } ${busy ? 'opacity-60' : ''}`}
            >
              <View
                className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                  isSelected ? 'border-violet-500 dark:border-violet-400' : 'border-line'
                }`}
              >
                {isSelected ? (
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: violet }} />
                ) : null}
              </View>
              <AppText
                weight={isSelected ? 'semibold' : 'normal'}
                className="flex-1 text-sm text-ink"
              >
                {option.label}
              </AppText>
            </Pressable>
          )
        })}
      </View>

      <AppText className="mt-3 text-xs text-faint">{note}</AppText>

      {isDefault ? (
        <AppText className="mt-1.5 text-xs text-soft">
          Şu an dengede tutuyorum; hazır olduğunda bana bir yön söyleyebilirsin.
        </AppText>
      ) : null}

      {error ? (
        <AppText className="mt-2 text-xs text-amber-600 dark:text-amber-400">{error}</AppText>
      ) : null}
    </View>
  )
}
