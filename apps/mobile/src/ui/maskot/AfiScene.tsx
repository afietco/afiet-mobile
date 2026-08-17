import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Confetti } from '@/ui/Confetti'
import { Overlay } from '@/ui/overlayHost'
import { AfiPose, type AfiMotion, type AfiPoseName } from './index'

/**
 * Shared full-screen celebration scene: Afi, a headline and one primary way out.
 *
 *   <AfiScene pose="ritim" title="Bu hafta afiyetteydin 🎉" onClose={ack} />
 *
 * Every celebration in the app is built from the same skeleton (dimmed
 * backdrop, confetti, zooming card) so the moments feel like one voice. What
 * differs between them is only content: pose, copy, an optional middle slot
 * and the badge pill.
 *
 * Mounting it is what shows it, and it draws in the app's overlay layer
 * (ui/overlayHost.tsx) like every other popup: over the tab bar, over the
 * status bar, and able to sit above a sheet that is still open behind it.
 *
 * Accessibility: the mascot stays decorative because the visible title always
 * carries the same meaning. The backdrop is the screen-reader escape hatch and
 * the card itself is tappable when there is no primary button.
 */

export interface AfiSceneProps {
  pose: AfiPoseName
  /** Falls back to the pose default. */
  motion?: AfiMotion
  size?: number
  title: string
  body?: string
  /** Middle slot between the body and the badge; owns its own spacing. */
  children?: ReactNode
  /** Badge pill text under the middle slot. */
  badge?: string
  /** Optional icon rendered before the badge text. */
  badgeIcon?: ReactNode
  /** Primary button label; without it the card shows the tap-to-close hint. */
  actionLabel?: string
  /** Primary button handler; defaults to closing the scene. */
  onAction?: () => void
  /** Replaces the primary label with a spinner and locks both buttons. */
  actionBusy?: boolean
  secondaryLabel?: string
  onSecondary?: () => void
  /** Android back button and backdrop. */
  onClose: () => void
  /** False keeps the scene open until one of the buttons is used. */
  dismissible?: boolean
  confetti?: boolean
}

export function AfiScene({
  pose,
  motion,
  size = 104,
  title,
  body,
  children,
  badge,
  badgeIcon,
  actionLabel,
  onAction,
  actionBusy = false,
  secondaryLabel,
  onSecondary,
  onClose,
  dismissible = true,
  confetti = true,
}: AfiSceneProps) {
  const { isDark } = useTheme()
  const backdrop = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
  } as const

  const card = (
    <View className="items-center rounded-3xl bg-surface p-6">
      <AfiPose pose={pose} motion={motion} size={size} />

      <AppText weight="extrabold" className="mt-3 text-center text-2xl text-ink">
        {title}
      </AppText>

      {body ? (
        <AppText className="mt-2 text-center leading-6 text-soft">{body}</AppText>
      ) : null}

      {children}

      {badge ? (
        <View className="mt-4 flex-row items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 dark:bg-emerald-900/50">
          {badgeIcon}
          <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
            {badge}
          </AppText>
        </View>
      ) : null}

      {actionLabel ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: actionBusy, busy: actionBusy }}
            disabled={actionBusy}
            onPress={onAction ?? onClose}
            className="mt-5 w-full items-center rounded-2xl bg-emerald-600 py-3.5"
          >
            {actionBusy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <AppText weight="bold" className="text-white">
                {actionLabel}
              </AppText>
            )}
          </Pressable>
          {secondaryLabel ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: actionBusy }}
              disabled={actionBusy}
              onPress={onSecondary}
              className="mt-2 w-full items-center py-3"
            >
              <AppText weight="semibold" className="text-soft">
                {secondaryLabel}
              </AppText>
            </Pressable>
          ) : null}
        </>
      ) : (
        <AppText className="mt-5 text-xs text-faint">Kapatmak için dokun</AppText>
      )}
    </View>
  )

  return (
    <Overlay onRequestClose={onClose}>
      <View
        className="items-center justify-center px-6"
        style={StyleSheet.absoluteFill}
        /* The scene fills the window rather than a slot in a layout, because
           the overlay layer gives it no height of its own. */
      >
        {dismissible ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kutlamayı kapat"
            onPress={onClose}
            style={backdrop}
          />
        ) : (
          <View pointerEvents="none" style={backdrop} />
        )}

        {confetti ? <Confetti /> : null}

        {/* Not animated in. An entering animation owns the first frame, and a
            run that never happens would leave this card at opacity zero over a
            dimmed screen. A scene opened with dismissible={false} keeps both
            ways out inside this view, so a missed animation there is an
            invisible wall with no way past it. */}
        <View style={{ width: '100%', maxWidth: 384 }}>
          {/* Without a primary button the whole card closes the scene, which is
              what the hint promises. It stays inaccessible to screen readers so
              the title and body keep being read one by one. */}
          {!actionLabel && dismissible ? (
            <Pressable accessible={false} onPress={onClose}>
              {card}
            </Pressable>
          ) : (
            card
          )}
        </View>
      </View>
    </Overlay>
  )
}
