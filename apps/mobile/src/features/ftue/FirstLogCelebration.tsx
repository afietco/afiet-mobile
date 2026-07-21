import { useRef, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, View } from 'react-native'
import Animated, { ZoomIn } from 'react-native-reanimated'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Confetti } from '@/ui/Confetti'
import { IconBowl } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import {
  dismissPushPrimer,
  requestPushPermission,
  shouldShowPushPrimer,
} from '@/features/push/push-notifications'

/* Native first-log celebration; shared confetti lives in ui/Confetti.tsx. */

interface FirstLogCelebrationProps {
  foodName: string
  onClose: () => void
}

/** One-time full-screen celebration followed by the push permission primer. */
export function FirstLogCelebration({ foodName, onClose }: FirstLogCelebrationProps) {
  const { isDark } = useTheme()
  const [stage, setStage] = useState<'celebration' | 'push-primer'>('celebration')
  const [busy, setBusy] = useState(false)
  const advancing = useRef(false)

  const finishCelebration = async () => {
    if (advancing.current) return
    advancing.current = true
    try {
      if (await shouldShowPushPrimer()) {
        setStage('push-primer')
        return
      }
      onClose()
    } catch {
      onClose()
    } finally {
      advancing.current = false
    }
  }

  const allowNotifications = async () => {
    if (busy) return
    setBusy(true)
    try {
      await requestPushPermission()
    } catch {
      // The account settings screen provides a durable retry path.
    } finally {
      onClose()
    }
  }

  const skipNotifications = async () => {
    if (busy) return
    setBusy(true)
    try {
      await dismissPushPrimer()
    } catch {
      // Closing the one-time primer must never trap the celebration flow.
    } finally {
      onClose()
    }
  }

  return (
    <Modal
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (stage === 'celebration') void finishCelebration()
        else void skipNotifications()
      }}
    >
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          accessibilityLabel={stage === 'celebration' ? 'Kutlamayı kapat' : undefined}
          onPress={stage === 'celebration' ? () => void finishCelebration() : undefined}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
          }}
        />

        {stage === 'celebration' ? <Confetti /> : null}

        <Animated.View entering={ZoomIn.duration(250)} style={{ width: '100%', maxWidth: 384 }}>
          {stage === 'celebration' ? (
            <View className="items-center rounded-3xl bg-surface p-6">
              <AfiPose pose="kutlama" motion="zipla" size={120} />
              <AppText weight="extrabold" className="mt-3 text-2xl text-ink">
                Afiyet olsun!
              </AppText>
              <AppText className="mt-2 text-center text-soft">
                “{foodName}” ile bugünün ilk kaydını yaptın. Böylece ilk afiyet gününü
                başlattın.
              </AppText>
              <View className="mt-4 flex-row items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 dark:bg-emerald-900/50">
                <IconBowl size={18} color={isDark ? '#6ee7b7' : '#047857'} />
                <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-300">
                  Bu hafta 1/5 afiyet günü
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => void finishCelebration()}
                className="mt-5 w-full items-center rounded-2xl bg-emerald-600 py-3.5"
              >
                <AppText weight="bold" className="text-white">
                  Devam ✨
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View className="items-center rounded-3xl bg-surface p-6">
              <AfiPose pose="selam" motion="selam" size={112} />
              <AppText weight="extrabold" className="mt-3 text-center text-2xl text-ink">
                Afi sana haber versin mi?
              </AppText>
              <AppText className="mt-2 text-center leading-6 text-soft">
                Öğününü hatırlatabilirim, afiyet haftanı kutlayabilirim ve sofrandan gelen
                selamları sana ulaştırabilirim.
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Bildirimleri aç"
                onPress={() => void allowNotifications()}
                disabled={busy}
                className="mt-5 w-full items-center rounded-2xl bg-emerald-600 py-3.5"
              >
                {busy ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <AppText weight="bold" className="text-white">
                    Bildirimleri aç
                  </AppText>
                )}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void skipNotifications()}
                disabled={busy}
                className="mt-2 w-full items-center py-3"
              >
                <AppText weight="semibold" className="text-soft">
                  Şimdilik değil
                </AppText>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}
