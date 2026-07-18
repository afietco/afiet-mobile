import type { ReactNode } from 'react'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { SofraKeseButton } from '@/features/sofra/SofraKeseButton'
import { tokens, useTheme } from '@/theme/useTheme'
import { IconMenu } from '@/ui/icons'
import { HamburgerMenu } from './HamburgerMenu'

/**
 * Ana sekmelerin üst yardımcı çubuğu. Sol tarafta sayfaya özel içerik (marka
 * ya da başlık), sağda sıralı üçlü: sofra kesesi · bildirim · hamburger.
 * Bildirim sheet'i @gorhom/bottom-sheet gereği ekran kökünde (kaydırma alanı
 * DIŞINDA) yaşamalı; bu yüzden açılışı parent'a bırakılır (onOpenNotifications)
 * ve NotificationsSheet ilgili ekranın kökünde render edilir. Hamburger menü
 * ise Modal olduğundan burada, çubuğun içinde durabilir.
 */
export function AppHeader({
  children,
  onOpenNotifications,
}: {
  children: ReactNode
  onOpenNotifications: () => void
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <View className="mb-4 flex-row items-start justify-between gap-3">
      <View className="min-w-0 flex-1">{children}</View>

      <View className="flex-row items-center gap-2">
        <SofraKeseButton />
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
