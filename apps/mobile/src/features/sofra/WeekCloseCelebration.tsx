import { useEffect } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { track } from '@/lib/track'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Confetti } from '@/ui/Confetti'
import { AfiPose } from '@/ui/maskot'
import { RhythmStrip } from './RhythmStrip'

/**
 * Hafta kapanışı kutlaması; YALNIZCA hedefe ulaşan haftada gösterilir
 * (ulaşamayan haftada hiçbir şey yok, pencere sessizce tazelenir:
 * afiyet-ritmi.md kayıp-dili yasağı). Afi + konfeti + haftanın şeridi +
 * toplam afiyet haftası. Bir kez gösterilir; kapatınca ack edilir.
 */

export interface WeekClosure {
  weekStart: string
  /** Pzt→Paz afiyet günleri. */
  days: boolean[]
  done: number
  goal: number
  /** Bu hafta dahil toplam afiyet haftası (kalıcı sayaç, asla azalmaz). */
  totalWeeks: number
}

export function WeekCloseCelebration({
  closure,
  onClose,
}: {
  closure: WeekClosure
  onClose: () => void
}) {
  const { isDark } = useTheme()

  useEffect(() => {
    track('afi_celebration_shown', { moment: 'week_close' })
  }, [])

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
            <AfiPose pose="kutlama" motion="zafer" size={104} />
            <AppText weight="extrabold" className="mt-4 text-2xl text-ink">
              Bu hafta afiyetteydin 🎉
            </AppText>
            <AppText className="mt-2 text-center text-soft">
              {closure.done} afiyet günü biriktirdin; bir afiyet haftası kazandın.
            </AppText>

            <View className="mt-4 w-full items-center rounded-2xl bg-canvas px-4 py-3">
              <RhythmStrip week={closure.days} todayIndex={-1} plain />
            </View>

            <View className="mt-4 rounded-full bg-emerald-100 px-3.5 py-1.5 dark:bg-emerald-900/50">
              <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
                Toplam {closure.totalWeeks} afiyet haftan 🧡
              </AppText>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              className="mt-5 w-full items-center rounded-2xl bg-emerald-600 py-3.5"
            >
              <AppText weight="bold" className="text-white">
                Yeni haftaya afiyetle ✨
              </AppText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}
