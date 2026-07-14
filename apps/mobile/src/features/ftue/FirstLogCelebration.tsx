import { Modal, Pressable, Text, View } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Confetti } from '@/ui/Confetti'
import { IconFlame } from '@/ui/icons'

/* Web FirstLogCelebration.tsx portu — konfeti ortak ui/Confetti.tsx'te. */

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

        <Confetti />

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
