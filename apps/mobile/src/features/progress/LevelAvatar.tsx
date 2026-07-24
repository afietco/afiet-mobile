import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
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
 * Avatar wrapped in a level ring, with the level number sitting on the rim.
 *
 * The arc fills toward the next level, so a glance answers both "who am I" and
 * "how far along am I". Geometry mirrors MemberRing and LevelRing so every ring
 * in the app reads as one family.
 *
 * The number is a fact, never a score to beat: no comparison, no countdown.
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const R = 15.5
const C = 2 * Math.PI * R

export function LevelAvatar({
  emoji,
  level,
  ratio,
  size = 48,
  /** Ring and badge stay hidden until progress is known, so no wrong level flashes. */
  ready = true,
}: {
  emoji?: string
  level: number
  ratio: number
  size?: number
  ready?: boolean
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const stroke = isDark ? '#34d399' : '#059669'

  const p = useSharedValue(0)
  useEffect(() => {
    p.value = withTiming(ready ? ratio : 0, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    })
  }, [ratio, ready, p])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: C - Math.min(p.value, 1) * C,
  }))

  return (
    <View style={{ width: size, height: size }} className="shrink-0">
      <Svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={18} cy={18} r={R} fill="none" strokeWidth={2.4} stroke={t.muted} />
        {ready ? (
          <AnimatedCircle
            cx={18}
            cy={18}
            r={R}
            fill="none"
            strokeWidth={2.4}
            strokeLinecap="round"
            stroke={stroke}
            strokeDasharray={`${C} ${C}`}
            animatedProps={animatedProps}
          />
        ) : null}
      </Svg>

      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <Text style={{ fontSize: Math.round(size * 0.42), lineHeight: Math.round(size * 0.5) }}>
          {emoji}
        </Text>
      </View>

      {ready ? (
        // Rozet halkanın alt kenarına oturur; kart zeminiyle aynı renkli çerçeve
        // halkayı "keser" ve rakam okunur kalır.
        <View
          className="absolute self-center rounded-full bg-emerald-600 px-1.5"
          style={{
            bottom: -3,
            borderWidth: 2,
            borderColor: t.surface,
            minWidth: Math.round(size * 0.38),
          }}
        >
          <AppText
            weight="extrabold"
            numberOfLines={1}
            className="text-center text-white"
            style={{ fontSize: Math.round(size * 0.22), lineHeight: Math.round(size * 0.3) }}
          >
            {level}
          </AppText>
        </View>
      ) : null}
    </View>
  )
}
