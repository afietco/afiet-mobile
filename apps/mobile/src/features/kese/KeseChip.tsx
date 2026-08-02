import { Pressable } from 'react-native'
import { AppText } from '@/ui/AppText'
import { useKese } from './useKese'

/**
 * How many messages are left this week, small enough to sit in a header.
 *
 * A number and a basket, nothing else. It is not a warning and never turns
 * red: an empty kese is a week that ran its course, not a failure, and the
 * screen it leads to says so in words (docs/09 invariant #2).
 *
 * Renders nothing until the server has answered. A chip that appeared with a
 * placeholder and then corrected itself would be read as the kese changing.
 */

interface KeseChipProps {
  onPress?: () => void
  /** What tapping does; the chip leads somewhere different on each screen. */
  hint?: string
  /** `header` sits beside the bell on Bugün, `compact` inside the chat bar. */
  variant?: 'header' | 'compact'
}

export function KeseChip({ onPress, hint, variant = 'header' }: KeseChipProps) {
  const kese = useKese()
  if (!kese) return null

  const compact = variant === 'compact'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`İkram kesen, bu hafta ${String(kese.remaining)} mesaj`}
      accessibilityHint={onPress ? hint : undefined}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={6}
      className={`flex-row items-center rounded-full bg-muted ${
        compact ? 'h-8 gap-1 px-2.5' : 'h-10 gap-1.5 px-3'
      }`}
    >
      <AppText className={compact ? 'text-sm' : 'text-base'}>🧺</AppText>
      <AppText
        weight="extrabold"
        className={`${compact ? 'text-sm' : 'text-[15px]'} ${
          kese.empty ? 'text-faint' : 'text-ink'
        }`}
      >
        {kese.remaining}
      </AppText>
    </Pressable>
  )
}
