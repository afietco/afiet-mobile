import { useRef, useState } from 'react'
import { useTheme } from '@/theme/useTheme'
import { IconBowl } from '@/ui/icons'
import { AfiScene } from '@/ui/maskot/AfiScene'
import {
  dismissPushPrimer,
  requestPushPermission,
  shouldShowPushPrimer,
} from '@/features/push/push-notifications'

/* Native first-log celebration; the shared scene lives in ui/maskot/AfiScene.tsx. */

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

  // Both stages render the same component in the same slot, so the modal stays
  // mounted across the switch and the primer fades in without a second present.
  return stage === 'celebration' ? (
    <AfiScene
      pose="kutlama"
      motion="zipla"
      size={120}
      title="Afiyet olsun!"
      body={`“${foodName}” ile bugünün ilk kaydını yaptın. Böylece ilk afiyet gününü başlattın.`}
      badge="Bu hafta 1/5 afiyet günü"
      badgeIcon={<IconBowl size={18} color={isDark ? '#6ee7b7' : '#047857'} />}
      actionLabel="Devam ✨"
      onAction={() => void finishCelebration()}
      onClose={() => void finishCelebration()}
    />
  ) : (
    <AfiScene
      pose="selam"
      motion="selam"
      size={112}
      title="Afi sana haber versin mi?"
      body="Öğününü hatırlatabilirim, afiyet haftanı kutlayabilirim ve sofrandan gelen selamları sana ulaştırabilirim."
      actionLabel="Bildirimleri aç"
      onAction={() => void allowNotifications()}
      actionBusy={busy}
      secondaryLabel="Şimdilik değil"
      onSecondary={() => void skipNotifications()}
      onClose={() => void skipNotifications()}
      dismissible={false}
      confetti={false}
    />
  )
}
