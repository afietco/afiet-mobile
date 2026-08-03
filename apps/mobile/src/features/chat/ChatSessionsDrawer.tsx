import { useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconPin, IconPlus, IconTrash, IconX } from '@/ui/icons'
import { Overlay } from '@/ui/overlayHost'
import type { ChatSessionMeta } from './types'

/**
 * Every conversation with this assistant, in a panel from the right.
 *
 * It follows the app-menu panel exactly (features/nav/HamburgerMenu), including
 * the two rules that keep a sliding panel out of the trap it was once removed
 * for: its hidden state is off-screen rather than transparent, so any tap that
 * lands anywhere but on the panel reaches the backdrop and closes it; and the
 * whole layer refuses touches the moment it is dismissed, for the length of the
 * closing slide.
 */

const PANEL_MAX_WIDTH = 340
const OPEN_MS = 260
const CLOSE_MS = 190

const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' })

/** "14:32" for today, "28 Tem" before that. Nothing needs to be more precise. */
function whenLabel(updatedAt: number): string {
  const then = new Date(updatedAt)
  const now = new Date()
  const sameDay =
    then.getFullYear() === now.getFullYear() &&
    then.getMonth() === now.getMonth() &&
    then.getDate() === now.getDate()
  return sameDay ? timeFmt.format(then) : dayFmt.format(then)
}

export interface ChatSessionsDrawerProps {
  open: boolean
  onClose: () => void
  sessions: ChatSessionMeta[]
  activeId: string | null
  onOpenSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onTogglePin: (id: string) => void
}

export function ChatSessionsDrawer({
  open,
  onClose,
  sessions,
  activeId,
  onOpenSession,
  onNewSession,
  onDeleteSession,
  onTogglePin,
}: ChatSessionsDrawerProps) {
  const insets = useSafeAreaInsets()
  const window = useWindowDimensions()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const reduced = useReducedMotion()
  const panelWidth = Math.min(PANEL_MAX_WIDTH, window.width * 0.82)

  const [mounted, setMounted] = useState(open)
  const progress = useSharedValue(open ? 1 : 0)

  /* The unmount is timed rather than taken from the animation's completion
     callback, for the reason spelled out in features/nav/HamburgerMenu: that
     callback is a worklet, and the `runOnJS` hop out of it crashes the app
     natively under worklets 0.10. Here the panel is opened over a reply that is
     still streaming, so the JS runtime is at its busiest exactly when the hop
     would land. */
  useEffect(() => {
    if (open) {
      setMounted(true)
      progress.value = reduced
        ? 1
        : withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) })
      return
    }
    if (reduced) {
      progress.value = 0
      setMounted(false)
      return
    }
    progress.value = withTiming(0, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) })
    const unmount = setTimeout(() => setMounted(false), CLOSE_MS)
    return () => clearTimeout(unmount)
  }, [open, progress, reduced])

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * panelWidth }],
  }))
  const dimStyle = useAnimatedStyle(() => ({ opacity: progress.value }))

  const confirmDelete = (session: ChatSessionMeta) => {
    Alert.alert(session.title, 'Bu sohbetin geçmişi silinsin mi? Sunucudan da gider.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => onDeleteSession(session.id) },
    ])
  }

  if (!mounted) return null

  return (
    <Overlay onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Sohbetleri kapat"
        onPress={onClose}
        pointerEvents={open ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,6,23,0.45)' }, dimStyle]}
        />
        <View style={{ flex: 1 }} />
        <Animated.View
          className="bg-canvas"
          style={[
            {
              width: panelWidth,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
            },
            panelStyle,
          ]}
        >
          {/* Consume panel touches so only the backdrop closes the drawer. */}
          <Pressable onPress={() => {}} className="flex-1 px-3">
            <View className="mb-3 flex-row items-center justify-between px-1">
              <AppText weight="extrabold" className="text-xl text-ink">
                Sohbetlerim
              </AppText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                onPress={onClose}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70"
              >
                <IconX size={18} color={t.soft} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yeni sohbet başlat"
              onPress={() => {
                onNewSession()
                onClose()
              }}
              className="mb-3 flex-row items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 active:opacity-90"
            >
              <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
              <AppText weight="bold" className="text-white">
                Yeni sohbet
              </AppText>
            </Pressable>

            {sessions.length === 0 ? (
              <AppText className="px-1 pt-2 text-sm text-faint">
                Konuştukça sohbetlerin burada birikir. İstediğine geri dönebilir,
                birini yukarıda sabitleyebilirsin 🌱
              </AppText>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="gap-1.5 pb-2">
                  {sessions.map((session) => {
                    const active = session.id === activeId
                    return (
                      <View
                        key={session.id}
                        className={`flex-row items-center gap-1 rounded-2xl px-2 py-1 ${
                          active ? 'bg-emerald-50 dark:bg-emerald-950/60' : 'bg-surface'
                        }`}
                      >
                        <Pressable
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          accessibilityLabel={session.title}
                          onPress={() => {
                            onOpenSession(session.id)
                            onClose()
                          }}
                          className="min-w-0 flex-1 py-2 pl-2 active:opacity-70"
                        >
                          <View className="flex-row items-center gap-1.5">
                            {session.pinned ? (
                              <IconPin size={13} color={isDark ? '#34d399' : '#059669'} />
                            ) : null}
                            <AppText
                              weight={active ? 'bold' : 'semibold'}
                              numberOfLines={1}
                              className="min-w-0 flex-1 text-sm text-ink"
                            >
                              {session.title}
                            </AppText>
                          </View>
                          <AppText className="mt-0.5 text-xs text-faint">
                            {whenLabel(session.updatedAt)}
                          </AppText>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            session.pinned ? 'Sabitlemeyi kaldır' : 'Sohbeti sabitle'
                          }
                          onPress={() => onTogglePin(session.id)}
                          hitSlop={4}
                          className="h-10 w-10 items-center justify-center rounded-xl active:bg-muted"
                        >
                          <IconPin
                            size={17}
                            color={session.pinned ? (isDark ? '#34d399' : '#059669') : t.faint}
                          />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Sohbeti sil"
                          onPress={() => confirmDelete(session)}
                          hitSlop={4}
                          className="h-10 w-10 items-center justify-center rounded-xl active:bg-muted"
                        >
                          <IconTrash size={17} color={t.faint} />
                        </Pressable>
                      </View>
                    )
                  })}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Overlay>
  )
}
