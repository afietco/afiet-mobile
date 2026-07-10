import { useEffect } from 'react'
import { Dimensions, Modal, Pressable, Text, View } from 'react-native'
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconFlame } from '@/ui/icons'

/* Web FirstLogCelebration.tsx portu — konfeti reanimated ile düşer/döner.
   Parça yerleşimi deterministik (sol %, gecikme, süre, renk). */
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

function Confetto({
  left,
  delay,
  duration,
  color,
  tilt,
}: (typeof CONFETTI)[number]) {
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

interface FirstLogCelebrationProps {
  foodName: string
  onClose: () => void
}

/** İlk besin kaydı kutlaması — konfetili tam ekran an, bir kez gösterilir */
export function FirstLogCelebration({ foodName, onClose }: FirstLogCelebrationProps) {
  const { isDark } = useTheme()
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityLabel="Kutlamayı kapat"
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          }}
        />

        {CONFETTI.map((c, i) => (
          <Confetto key={i} {...c} />
        ))}

        <Animated.View entering={ZoomIn.duration(250)} style={{ width: '100%', maxWidth: 384 }}>
          <View className="items-center rounded-3xl bg-surface p-6">
            <Text style={{ fontSize: 56, lineHeight: 68 }}>🎉</Text>
            <AppText weight="extrabold" className="mt-3 text-2xl text-ink">
              Afiyet olsun!
            </AppText>
            <AppText className="mt-2 text-center text-soft">
              “{foodName}” ile denge skorun işlemeye başladı. Her kayıt, gününü biraz daha
              görünür kılar.
            </AppText>
            <View className="mt-4 flex-row items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1.5 dark:bg-amber-900/50">
              <IconFlame size={18} color={isDark ? '#fcd34d' : '#b45309'} />
              <AppText weight="bold" className="text-sm text-amber-700 dark:text-amber-300">
                Seri başladı — 1. gün
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="mt-5 w-full items-center rounded-2xl bg-emerald-600 py-3.5"
            >
              <AppText weight="bold" className="text-white">
                Devam ✨
              </AppText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}
