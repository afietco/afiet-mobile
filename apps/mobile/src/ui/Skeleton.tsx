import { useEffect, useRef } from 'react'
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { useMotionActive } from '@/ui/motionGate'

/**
 * Animated placeholder that exposes its loading state to screen readers.
 *
 * A full page skeleton is a dozen of these at once, and a screen whose query
 * never settles keeps them shimmering for the rest of the session, so the
 * shimmer rests whenever the shared motion gate is closed.
 */
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
  const shimmering = useMotionActive()

  useEffect(() => {
    if (!shimmering) {
      /* Settled through an animation rather than setValue: the value has been
         handed to the native driver, and easing it to rest keeps a shimmer
         that stops mid-breath from snapping. */
      Animated.timing(pulse, { toValue: 0.75, duration: 160, useNativeDriver: true }).start()
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 650, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [pulse, shimmering])

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
