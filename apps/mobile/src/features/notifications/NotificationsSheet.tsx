import { formatShortTR, relativeDayLabel } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { acceptRequest, declineRequest } from '@/features/social/store'
import { AppText } from '@/ui/AppText'
import { Sheet } from '@/ui/Sheet'
import { dismissRequest, markAllRead, refreshNotifications, useNotifications } from './notifications'

/**
 * Bildirim listesi sheet'i. Açılınca tümü okundu sayılır (zildeki nokta
 * söner); ton yargısız ve sakin, aciliyet dili yok. Afiyet olsun selamları
 * ve arkadaşlık bildirimleri aynı listede birikir; arkadaşlık isteği kalemi
 * doğrudan buradan kabul/ret edilebilir (gerçek API, optimistik: kalem hemen
 * düşer, arka planda liste tazelenir).
 */
export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items } = useNotifications()

  useEffect(() => {
    if (!open) return
    // Önce taze liste, sonra okundu imleci: yeni gelenler de görülür sayılır.
    void refreshNotifications().then(markAllRead)
  }, [open])

  // İstek kabul/ret: gerçek API'yi optimistik çağır (arkadaşa çevir / düşür),
  // kalemi listeden hemen düşür; store arka planda bildirimleri de tazeler.
  const onAccept = (requestId: string) => {
    acceptRequest(requestId)
    dismissRequest(requestId)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }
  const onDecline = (requestId: string) => {
    declineRequest(requestId)
    dismissRequest(requestId)
  }

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
            <View key={n.id} className="rounded-2xl bg-canvas p-4">
              <View className="flex-row items-center gap-3">
                <Text style={{ fontSize: 20, lineHeight: 26 }}>{n.emoji}</Text>
                <View className="min-w-0 flex-1">
                  <AppText className="text-sm text-ink">{n.text}</AppText>
                  <AppText className="mt-0.5 text-xs text-faint">
                    {relativeDayLabel(n.date) ?? formatShortTR(n.date)}
                  </AppText>
                </View>
              </View>
              {n.kind === 'friend_request' && n.requestId ? (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="İsteği kabul et"
                    onPress={() => onAccept(n.requestId!)}
                    className="flex-1 items-center rounded-xl bg-emerald-600 py-2.5 active:opacity-80"
                  >
                    <AppText weight="semibold" className="text-sm text-white">
                      Kabul et
                    </AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="İsteği reddet"
                    onPress={() => onDecline(n.requestId!)}
                    className="flex-1 items-center rounded-xl bg-muted py-2.5 active:opacity-80"
                  >
                    <AppText weight="semibold" className="text-sm text-soft">
                      Reddet
                    </AppText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Sheet>
  )
}
