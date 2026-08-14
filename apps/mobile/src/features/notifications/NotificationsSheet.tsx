import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { parsePushTarget, routeForPushTarget } from '@/features/push/push-target'
import {
  acceptGroupInvitation,
  acceptRequest,
  declineGroupInvitation,
  declineRequest,
} from '@/features/social/store'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { Sheet } from '@/ui/Sheet'
import {
  dismissRequest,
  markAllRead,
  markRead,
  refreshNotifications,
  useNotifications,
  type AppNotification,
} from './notifications'

/**
 * Bildirim listesi sheet'i. Ton yargısız ve sakin, aciliyet dili yok.
 *
 * Zil birincil kanal olduğu için liste üç şeyi birden taşıyor: selamlar,
 * arkadaşlık bildirimleri ve kişinin kazandığı kutlamalar (push kapısı o
 * kutlamayı göndermemiş olsa bile). Arkadaşlık isteği kalemi doğrudan buradan
 * kabul/ret edilebilir (gerçek API, optimistik).
 *
 * İki bölüm var: okunmamışlar "Yeni", okunmuşlar "Daha önce" altında ve soluk.
 * Geçmiş kaybolmasın ama yenilerin arasında kalabalık yapmasın diye
 * (kullanıcı kararı, 13 Ağu 2026). Sıra iki bölümün içinde de en yeniden
 * eskiye.
 *
 * Okundu kalem başınadır: sheet'in AÇILMASI hiçbir şeyi okumuş saymaz.
 * Dokunmak okur; ama sebebi hâlâ açık olan bir kalem okunmaz (alınmamış görev
 * ödülü gibi) - bunu sunucu söyler, burada bilinmesi gerekmez.
 *
 * Tarih satırı BİLEREK yok: "Bugün" yazan üçüncü bir satır listeyi ağırlaştırıp
 * hiçbir şey söylemiyordu. Sıra zaten yeniden eskiye.
 */
export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items } = useNotifications()
  const router = useRouter()
  const unread = items.filter((n) => !n.read)
  const earlier = items.filter((n) => n.read)

  useEffect(() => {
    if (!open) return
    void refreshNotifications()
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

  /* The invitation answers are the server's to record, and the bell refreshes
     itself once they land (social/store). The item is marked read here so it
     leaves "Yeni" straight away rather than on the next poll: the person just
     answered it, which is the most read anything gets. */
  const onAcceptInvite = (invitationId: string, itemId: string) => {
    acceptGroupInvitation(invitationId)
    markRead(itemId)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }
  const onDeclineInvite = (invitationId: string, itemId: string) => {
    declineGroupInvitation(invitationId)
    markRead(itemId)
  }

  /* Dokunmak her zaman okumayı DENER, gidecek yer olsun olmasın: metinden
     ibaret bir kutlamanın da okunabilmesi gerekiyor. Sebebi açık olan kalemde
     sunucu okundu saymaz ve kalem "Yeni"de kalır. Hedef jetonu push'un
     kullandığı kümeden geçer (push-target.ts), yani zil de uygulamanın
     önceden seçtiği yerlerden başka bir yere gidemez. 'notifications' hedefi
     zaten burasıdır: o kalemde yalnız sheet kapanır. */
  const onItemPress = (id: string, target?: string) => {
    markRead(id)
    const parsed = target ? parsePushTarget(target) : null
    if (!parsed || parsed === 'notifications') return
    onClose()
    router.push(routeForPushTarget(parsed))
  }

  const row = (n: AppNotification) => (
    <Pressable
      key={n.id}
      accessibilityRole="button"
      accessibilityLabel={n.read ? n.text : `${n.text}, okunmadı`}
      onPress={() => onItemPress(n.id, n.target)}
      className={`rounded-2xl bg-canvas p-4 active:opacity-80 ${n.read ? 'opacity-60' : ''}`}
    >
      <View className="flex-row items-start gap-3">
        <Text style={{ fontSize: 20, lineHeight: 24 }}>{n.emoji}</Text>
        <View className="min-w-0 flex-1">
          <AppText className="text-sm text-ink">{n.text}</AppText>
          {n.detail ? <AppText className="mt-0.5 text-xs text-soft">{n.detail}</AppText> : null}
        </View>
        {/* Okunmamışı gösteren tek işaret; sayı zilde zaten var. */}
        {n.read ? null : <View className="mt-1.5 h-2 w-2 rounded-full bg-orange-500" />}
      </View>
      {n.kind === 'group_invite' && n.requestId ? (
        <View className="mt-3 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sofra davetini kabul et"
            onPress={() => onAcceptInvite(n.requestId!, n.id)}
            className="flex-1 items-center rounded-xl bg-emerald-600 py-2.5 active:opacity-80"
          >
            <AppText weight="semibold" className="text-sm text-white">
              Katıl
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sofra davetini reddet"
            onPress={() => onDeclineInvite(n.requestId!, n.id)}
            className="flex-1 items-center rounded-xl bg-muted py-2.5 active:opacity-80"
          >
            <AppText weight="semibold" className="text-sm text-soft">
              Şimdi değil
            </AppText>
          </Pressable>
        </View>
      ) : null}
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
    </Pressable>
  )

  return (
    <Sheet
      name="notifications"
      open={open}
      onClose={onClose}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          Bildirimler
        </AppText>
      }
    >
      {items.length === 0 ? (
        <View className="items-center py-4">
          <AfiPose pose="sicaklik" size={80} accessibilityLabel="Afi, sofrandan haber bekliyor" />
          <AppText className="mt-2 text-center text-sm text-faint">
            Henüz bildirim yok. Sofrandan haber geldiğinde burada görünür 🌱
          </AppText>
        </View>
      ) : (
        <View className="gap-2 pb-2">
          {unread.length > 0 ? (
            <View className="flex-row items-center justify-between">
              <AppText weight="semibold" className="text-xs text-faint">
                Yeni
              </AppText>
              {/* Sheet'in kendi Kapat düğmesi başlıkta duruyor; toplu eylem
                  oraya konunca ikisi üst üste biniyordu. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Hepsini okundu say"
                onPress={markAllRead}
                hitSlop={8}
                className="active:opacity-70"
              >
                <AppText weight="semibold" className="text-xs text-soft">
                  Hepsini okundu say
                </AppText>
              </Pressable>
            </View>
          ) : null}
          {unread.map(row)}
          {earlier.length > 0 ? (
            <AppText weight="semibold" className={`text-xs text-faint ${unread.length ? 'mt-3' : ''}`}>
              Daha önce
            </AppText>
          ) : null}
          {earlier.map(row)}
        </View>
      )}
    </Sheet>
  )
}
