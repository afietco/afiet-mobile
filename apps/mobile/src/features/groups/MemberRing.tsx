import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
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

/**
 * Üye avatarı + enerji halkası — Bugün'deki MacroRings halkasının üye boyu.
 * Halka 0'dan başlayıp değere doğru BÜYÜYEREK dolar; dolarken rengi de
 * ilerlemeyle olgunlaşır: maviden yeşile, %100 aşımında turuncudan kırmızıya
 * (aşım +%40'ta kırmızıya doyar; aşımda halka tam tur, şiddeti renk anlatır).
 */

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const SIZE = 48
const R = 15.5
const C = 2 * Math.PI * R

const STOPS = [0, 1, 1.0001, 1.4]
const LIGHT = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const DARK = ['#60a5fa', '#34d399', '#fbbf24', '#f87171']

export function MemberRing({ initial, ratio }: { initial: string | null; ratio: number }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const colors = isDark ? DARK : LIGHT

  const p = useSharedValue(0)
  useEffect(() => {
    p.value = 0
    p.value = withTiming(ratio, { duration: 1200, easing: Easing.out(Easing.cubic) })
  }, [ratio, p])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: C - Math.min(p.value, 1) * C,
    stroke: interpolateColor(p.value, STOPS, colors),
  }))

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg
        width={SIZE}
        height={SIZE}
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
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-muted">
          {initial ? (
            <AppText weight="bold" className="text-sm text-soft">
              {initial}
            </AppText>
          ) : (
            <IconUser size={16} color={t.faint} />
          )}
        </View>
      </View>
    </View>
  )
}
