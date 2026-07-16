import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { IconBell } from '@/ui/icons'
import { unreadCount, useNotifications } from './notifications'

/**
 * Ana ekranların sağ üstündeki sabit zil. Okunmamış bildirim varsa turuncu
 * nokta; dokununca ekran kökündeki NotificationsSheet açılır (sheet kaydırma
 * alanı dışında yaşamalı, o yüzden buton ve sheet ayrı bileşen).
 */
export function NotificationBell({ onPress }: { onPress: () => void }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const unread = unreadCount(useNotifications())

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0 ? `Bildirimler, ${unread} okunmamış` : 'Bildirimler'
      }
      onPress={onPress}
      hitSlop={6}
      className="h-10 w-10 items-center justify-center rounded-full bg-muted"
    >
      <IconBell size={19} color={t.soft} />
      {unread > 0 ? (
        <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-surface bg-orange-500" />
      ) : null}
    </Pressable>
  )
}
