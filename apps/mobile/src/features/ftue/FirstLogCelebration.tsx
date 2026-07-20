import { Modal, Pressable, View } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Confetti } from '@/ui/Confetti'
import { IconBowl } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'

/* Web FirstLogCelebration.tsx portu; konfeti ortak ui/Confetti.tsx'te. */

interface FirstLogCelebrationProps {
  foodName: string
  onClose: () => void
}

/** İlk besin kaydı kutlaması; konfetili tam ekran an, bir kez gösterilir */
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
            <AfiPose pose="kutlama" motion="zipla" size={104} />
            <AppText weight="extrabold" className="mt-3 text-2xl text-ink">
              Afiyet olsun!
            </AppText>
            <AppText className="mt-2 text-center text-soft">
              “{foodName}” ilk afiyet günün oldu. Her kayıt, afiyet haftanı biraz daha görünür
              kılar.
            </AppText>
            <View className="mt-4 flex-row items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 dark:bg-emerald-900/50">
              <IconBowl size={18} color={isDark ? '#6ee7b7' : '#047857'} />
              <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-300">
                İlk afiyet günün, bu hafta 1/5
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
