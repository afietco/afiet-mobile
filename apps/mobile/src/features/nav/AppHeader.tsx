import { router, type Href } from 'expo-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { KeseChip } from '@/features/kese/KeseChip'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { IconMenu } from '@/ui/icons'
import { HamburgerMenu } from './HamburgerMenu'

/** Shared tab header with page content on the left and notification/menu actions on the right. */
export function AppHeader({
  children,
  onOpenNotifications,
  showKese = false,
}: {
  children: ReactNode
  onOpenNotifications: () => void
  /**
   * Bugün only. The kese belongs where the day starts, but every tab wearing
   * a message counter would make it the loudest number in the app, and it is
   * meant to be the quietest one that still means something.
   */
  showKese?: boolean
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <View className="mb-4 flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1">{children}</View>

      <View className="flex-row items-center gap-2">
        {showKese ? (
          <KeseChip
            hint="Afi ile sohbeti açar"
            onPress={() => {
              trackTap('kese_chip')
              router.push('/sohbet' as Href)
            }}
          />
        ) : null}
        <NotificationBell onPress={onOpenNotifications} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menü"
          onPress={() => setMenuOpen(true)}
          hitSlop={6}
          className="h-10 w-10 items-center justify-center rounded-full bg-muted"
        >
          <IconMenu size={20} color={t.soft} strokeWidth={2} />
        </Pressable>
      </View>

      <HamburgerMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  )
}
