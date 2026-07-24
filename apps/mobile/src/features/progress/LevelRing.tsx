import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

/**
 * Level ring for the profile: the arc fills toward the next level and the
 * current level sits in the middle. Mirrors MemberRing's geometry so the two
 * rings read as one family.
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const R = 15.5
const C = 2 * Math.PI * R

export function LevelRing({
  progress,
  size = 96,
}: {
  /** Yalnız çizim için gerekenler; kaynağın API mı yerel hesap mı olduğu fark etmez. */
  progress: { level: number; ratio: number }
  size?: number
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const stroke = isDark ? '#34d399' : '#059669'

  const p = useSharedValue(0)
  useEffect(() => {
    p.value = 0
    p.value = withTiming(progress.ratio, { duration: 1100, easing: Easing.out(Easing.cubic) })
  }, [progress.ratio, p])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: C - Math.min(p.value, 1) * C,
  }))

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 36 36" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={18} cy={18} r={R} fill="none" strokeWidth={2.6} stroke={t.muted} />
        <AnimatedCircle
          cx={18}
          cy={18}
          r={R}
          fill="none"
          strokeWidth={2.6}
          strokeLinecap="round"
          stroke={stroke}
          strokeDasharray={`${C} ${C}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <AppText
          weight="extrabold"
          className="text-ink"
          style={{ fontSize: Math.round(size * 0.3), lineHeight: Math.round(size * 0.36) }}
        >
          {progress.level}
        </AppText>
        <AppText className="text-[10px] text-faint">seviye</AppText>
      </View>
    </View>
  )
}
