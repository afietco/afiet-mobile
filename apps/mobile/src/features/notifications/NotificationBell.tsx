import { useEffect } from 'react'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBell } from '@/ui/icons'
import { refreshNotifications, unreadCount, useNotifications } from './notifications'

/**
 * Ana ekranların sağ üstündeki sabit zil. Okunmamış bildirim varsa turuncu
 * nokta; dokununca ekran kökündeki NotificationsSheet açılır (sheet kaydırma
 * alanı dışında yaşamalı, o yüzden buton ve sheet ayrı bileşen).
 */
export function NotificationBell({ onPress }: { onPress: () => void }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const unread = unreadCount(useNotifications())

  // Zil hangi ekranda görünürse görünsün listeyi tazeler; sekme geçişleri
  // okunmamış noktayı canlı tutar (push gelene dek yeterli tazelik).
  useEffect(() => {
    void refreshNotifications()
  }, [])

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
        <View
          className="absolute -right-0.5 -top-0.5 items-center justify-center rounded-full border border-surface bg-orange-500 px-1"
          style={{ minWidth: 18, height: 18 }}
        >
          <AppText weight="extrabold" className="text-[10px] text-white">
            {unread > 9 ? '9+' : unread}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  )
}
