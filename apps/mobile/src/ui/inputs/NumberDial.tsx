import { formatDecimalTR, parseDecimal } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { Pressable, TextInput, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '../AppText'
import { IconMinus, IconPlus } from '../icons'

interface NumberDialProps {
  /** Raw decimal text that can also be edited directly. */
  value: string
  onChange: (v: string) => void
  unit: string
  min: number
  max: number
  step?: number
  /** Starting value used by the stepper when the input is empty. */
  fallback: number
  ariaLabel: string
}

/** Large numeric input with decrement and increment controls. */
export function NumberDial({
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  fallback,
  ariaLabel,
}: NumberDialProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const num = parseDecimal(value)

  const nudge = (dir: 1 | -1) => {
    void Haptics.selectionAsync()
    const base = num ?? fallback
    const next = Math.min(max, Math.max(min, Math.round((base + dir * step) * 10) / 10))
    onChange(formatDecimalTR(next))
  }

  const btn = 'h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted'

  return (
    <View className="flex-row items-center gap-2 rounded-3xl bg-surface p-4">
      <Pressable accessibilityRole="button" accessibilityLabel="Azalt" onPress={() => nudge(-1)} className={btn}>
        <IconMinus size={24} color={t.soft} strokeWidth={2.4} />
      </Pressable>
      <View className="min-w-0 flex-1 items-center">
        <TextInput
          keyboardType="decimal-pad"
          value={value}
          onChangeText={onChange}
          placeholder={formatDecimalTR(fallback)}
          placeholderTextColor={t.line}
          accessibilityLabel={ariaLabel}
          className="w-full text-center text-ink"
          // A minimum height preserves the base layout while allowing scaled text to grow.
          style={{ fontFamily: 'Nunito_800ExtraBold', fontSize: 40, minHeight: 56, paddingVertical: 0 }}
        />
        <AppText weight="semibold" className="text-sm text-faint">
          {unit}
        </AppText>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Artır" onPress={() => nudge(1)} className={btn}>
        <IconPlus size={24} color={t.soft} strokeWidth={2.4} />
      </Pressable>
    </View>
  )
}
