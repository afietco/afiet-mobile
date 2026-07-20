import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconUser } from '@/ui/icons'

/** Member avatar with an energy ring only when the ratio is available. */

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

// A fixed viewBox keeps the ring proportional at every rendered size.
const R = 15.5
const C = 2 * Math.PI * R

const STOPS = [0, 1, 1.0001, 1.4]
const LIGHT = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const DARK = ['#60a5fa', '#34d399', '#fbbf24', '#f87171']

export function MemberRing({
  emoji,
  initial,
  ratio,
  size = 48,
}: {
  /** Profile emoji rendered in the center when available. */
  emoji: string | null
  initial: string | null
  ratio: number | null
  /** Outer size in pixels. */
  size?: number
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const colors = isDark ? DARK : LIGHT
  const hasEnergy = ratio !== null && Number.isFinite(ratio)
  const safeRatio = hasEnergy ? Math.max(0, ratio) : 0

  // Without shared energy data, the neutral avatar uses the full ring footprint.
  const inner = hasEnergy ? Math.round(size * 0.667) : size
  const emojiSize = Math.round(size * 0.34)
  const iconSize = Math.round(size / 3)
  const initialSize = Math.round(size * 0.29)

  const p = useSharedValue(0)
  useEffect(() => {
    p.value = 0
    p.value = withTiming(safeRatio, { duration: 1200, easing: Easing.out(Easing.cubic) })
  }, [safeRatio, p])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: C - Math.min(p.value, 1) * C,
    stroke: interpolateColor(p.value, STOPS, colors),
  }))

  return (
    <View style={{ width: size, height: size }}>
      {hasEnergy ? (
        <Svg
          width={size}
          height={size}
          viewBox="0 0 36 36"
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle cx={18} cy={18} r={R} fill="none" strokeWidth={2.6} stroke={t.muted} />
          <AnimatedCircle
            cx={18}
            cy={18}
            r={R}
            fill="none"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray={`${C} ${C}`}
            animatedProps={animatedProps}
          />
        </Svg>
      ) : null}
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <View
          className="items-center justify-center rounded-full bg-muted"
          style={{ width: inner, height: inner }}
        >
          {emoji ? (
            <Text style={{ fontSize: emojiSize, lineHeight: Math.round(emojiSize * 1.25) }}>
              {emoji}
            </Text>
          ) : initial ? (
            <AppText
              weight="bold"
              className="text-soft"
              style={{ fontSize: initialSize, lineHeight: Math.round(initialSize * 1.43) }}
            >
              {initial}
            </AppText>
          ) : (
            <IconUser size={iconSize} color={t.faint} />
          )}
        </View>
      </View>
    </View>
  )
}
