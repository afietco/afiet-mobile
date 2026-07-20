import { useEffect, useRef } from 'react'
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'

/** Animated placeholder that exposes its loading state to screen readers. */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 7,
  color,
  style,
}: {
  width?: DimensionValue
  height?: DimensionValue
  radius?: number
  color?: string
  style?: StyleProp<ViewStyle>
}) {
  const { isDark } = useTheme()
  const base = color ?? tokens[isDark ? 'dark' : 'light'].line
  const pulse = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Yükleniyor"
      accessibilityState={{ busy: true }}
      style={[{ width, height, borderRadius: radius, backgroundColor: base, opacity: pulse }, style]}
    />
  )
}
