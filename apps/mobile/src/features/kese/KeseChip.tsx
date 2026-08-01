import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { cycleKeseScenario, useKese } from './useKese'

/**
 * How many messages are left this week, small enough to sit in a header.
 *
 * A number and a basket, nothing else. It is not a warning and never turns
 * red: an empty kese is a week that ran its course, not a failure, and the
 * screen it leads to says so in words (docs/09 invariant #2).
 */

interface KeseChipProps {
  onPress?: () => void
  /** `header` sits beside the bell on Bugün, `compact` inside the chat bar. */
  variant?: 'header' | 'compact'
}

export function KeseChip({ onPress, variant = 'header' }: KeseChipProps) {
  const kese = useKese()
  const [scenario, setScenario] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  /* Mock-only: walks through the calibration states on a device. Goes away
     with features/kese/mock.ts, and until then it costs the shipping chip
     nothing but this handler. */
  const cycle = () => {
    const label = cycleKeseScenario()
    if (!label) return
    void Haptics.selectionAsync()
    setScenario(label)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setScenario(null), 2200)
  }

  const compact = variant === 'compact'

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`İkram kesen, bu hafta ${String(kese.remaining)} mesaj`}
        accessibilityHint={onPress ? 'Afi ile sohbeti açar' : undefined}
        onPress={onPress}
        onLongPress={cycle}
        disabled={!onPress && !__DEV__}
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

      {scenario ? (
        <View className="absolute right-0 top-11 z-10 rounded-lg bg-ink px-2.5 py-1.5">
          <AppText numberOfLines={1} className="text-[11px] text-canvas">
            {scenario}
          </AppText>
        </View>
      ) : null}
    </View>
  )
}
