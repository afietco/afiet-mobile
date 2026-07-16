import { formatShortTR, relativeDayLabel } from '@afiet/core'
import { useEffect } from 'react'
import { Text, View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { Sheet } from '@/ui/Sheet'
import { markAllRead, refreshNotifications, useNotifications } from './notifications'

/**
 * Bildirim listesi sheet'i. Açılınca tümü okundu sayılır (zildeki nokta
 * söner); ton yargısız ve sakin, aciliyet dili yok. Afiyet olsun selamları
 * ve ileride push'a düşecek bildirimler aynı listede birikir.
 */
export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items } = useNotifications()

  useEffect(() => {
    if (!open) return
    // Önce taze liste, sonra okundu imleci — yeni gelenler de görülür sayılır.
    void refreshNotifications().then(markAllRead)
  }, [open])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          Bildirimler
        </AppText>
      }
    >
      {items.length === 0 ? (
        <AppText className="py-6 text-center text-sm text-faint">
          Henüz bildirim yok. Sofrandan haber geldiğinde burada görünür 🌱
        </AppText>
      ) : (
        <View className="gap-2 pb-2">
          {items.map((n) => (
            <View key={n.id} className="flex-row items-center gap-3 rounded-2xl bg-canvas p-4">
              <Text style={{ fontSize: 20, lineHeight: 26 }}>{n.emoji}</Text>
              <View className="min-w-0 flex-1">
                <AppText className="text-sm text-ink">{n.text}</AppText>
                <AppText className="mt-0.5 text-xs text-faint">
                  {relativeDayLabel(n.date) ?? formatShortTR(n.date)}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      )}
    </Sheet>
  )
}
