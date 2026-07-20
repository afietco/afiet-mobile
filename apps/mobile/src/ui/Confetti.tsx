import { useEffect } from 'react'
import { Dimensions } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

/**
 * Konfeti yağmuru; kutlama anlarının ortak parçası (ilk kayıt, hafta
 * kapanışı…). Parça yerleşimi deterministik (sol %, gecikme, süre, renk);
 * web FirstLogCelebration.tsx portundan çıkarıldı.
 */
const CONFETTI: { left: number; delay: number; duration: number; color: string; tilt: number }[] = [
  { left: 6, delay: 0, duration: 2.2, color: '#10b981', tilt: 12 },
  { left: 14, delay: 0.35, duration: 2.6, color: '#f59e0b', tilt: -20 },
  { left: 22, delay: 0.1, duration: 2.1, color: '#8b5cf6', tilt: 30 },
  { left: 30, delay: 0.5, duration: 2.8, color: '#0ea5e9', tilt: -8 },
  { left: 38, delay: 0.2, duration: 2.4, color: '#d946ef', tilt: 18 },
  { left: 46, delay: 0.6, duration: 2.3, color: '#10b981', tilt: -25 },
  { left: 54, delay: 0.05, duration: 2.7, color: '#f59e0b', tilt: 8 },
  { left: 62, delay: 0.45, duration: 2.2, color: '#0ea5e9', tilt: -15 },
  { left: 70, delay: 0.25, duration: 2.5, color: '#8b5cf6', tilt: 22 },
  { left: 78, delay: 0.55, duration: 2.3, color: '#d946ef', tilt: -12 },
  { left: 86, delay: 0.15, duration: 2.6, color: '#10b981', tilt: 16 },
  { left: 94, delay: 0.4, duration: 2.4, color: '#f59e0b', tilt: -28 },
]

function Confetto({ left, delay, duration, color, tilt }: (typeof CONFETTI)[number]) {
  const screenH = Dimensions.get('window').height
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withDelay(
      delay * 1000,
      withRepeat(withTiming(1, { duration: duration * 1000, easing: Easing.linear }), -1),
    )
  }, [progress, delay, duration])

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -20 + progress.value * (screenH + 40) },
      { rotate: `${tilt + progress.value * 300}deg` },
    ],
    opacity: progress.value < 0.85 ? 1 : Math.max(0, 1 - (progress.value - 0.85) / 0.15),
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: `${left}%`,
          width: 6,
          height: 12,
          borderRadius: 3,
          backgroundColor: color,
        },
        style,
      ]}
    />
  )
}

/** Tam ekran konfeti katmanı; mutlak konumlu ebeveyn içinde kullanılır. */
export function Confetti() {
  return (
    <>
      {CONFETTI.map((c, i) => (
        <Confetto key={i} {...c} />
      ))}
    </>
  )
}
