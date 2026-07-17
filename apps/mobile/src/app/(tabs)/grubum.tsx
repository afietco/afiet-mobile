import { todayISO } from '@afiet/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { ApiError, type ApiGroupView } from '@/data/api/client'
import { subscribe } from '@/data/live'
import { useAuth } from '@/features/auth/AuthContext'
import { CreateGroupSheet } from '@/features/groups/CreateGroupSheet'
import { GroupEditSheet } from '@/features/groups/GroupEditSheet'
import { GroupHome } from '@/features/groups/GroupHome'
import { JoinGroupSheet } from '@/features/groups/JoinGroupSheet'
import { consumePendingJoin, onPendingJoin } from '@/features/groups/pendingJoin'
import { PublicGroupsDiscover } from '@/features/groups/PublicGroupsDiscover'
import { groupErrorMessage, useGroups } from '@/features/groups/useGroups'
import { AppHeader } from '@/features/nav/AppHeader'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconUsers } from '@/ui/icons'
import { PageSkeleton } from '@/ui/PageSkeleton'

/* Grubum sekmesi, TEK grup modeli: herkes en fazla bir grupta bulunur.
   Grubu olmayana kur/katıl; grubu olana grubun kendisi (GroupHome) gösterilir.
   Katılma/kurma sonrası pop-up yok, grup doğrudan bu sayfada belirir.
   Sheet'ler @gorhom/bottom-sheet gereği ScrollView'ın KARDEŞİ olarak ekran
   kökünde durur; grup görünümü (view) bu yüzden sayfa düzeyinde yüklenir
   (GroupHome ve GroupEditSheet aynı görünümü paylaşır). */

function EmptyState({
  onCreate,
  onJoin,
  onJoined,
}: {
  onCreate: () => void
  onJoin: () => void
  onJoined: (view: ApiGroupView) => void
}) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} className="pb-8 pt-4">
      <View className="items-center">
        <View className="mb-6 h-24 w-24 items-center justify-center overflow-hidden rounded-[32px]">
          <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id="grp" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#10b981" />
                <Stop offset="1" stopColor="#2dd4bf" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grp)" />
          </Svg>
          <IconUsers size={48} color="#ffffff" strokeWidth={1.6} />
        </View>
        <AppText weight="extrabold" className="text-center text-2xl text-ink">
          Sofra kalabalık güzel 🍲
        </AppText>
        <AppText className="mt-3 max-w-xs text-center text-soft">
          Ailenle ya da arkadaşlarınla bir grup kur, dengeyi birlikte kovalayın.
          Birbirinizi kutlayın.
        </AppText>
      </View>
      <View className="mt-8 flex-row gap-2">
        <Pressable
          accessibilityRole="button"
          onPress={onCreate}
          className="flex-1 items-center rounded-2xl bg-emerald-600 py-4 active:opacity-90"
        >
          <AppText weight="bold" className="text-white">
            Grup kur
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onJoin}
          className="flex-1 items-center rounded-2xl bg-surface py-4 active:opacity-80"
        >
          <AppText weight="bold" className="text-emerald-700 dark:text-emerald-300">
            ID ile katıl
          </AppText>
        </Pressable>
      </View>

      {/* Grubu olmayan kullanıcıya herkese açık grup keşfi (yalnız bu boş ekranda).
          Katılma gerçek: dönen görünümle Grubum listesi tazelenir, grup bu
          sayfada belirir (bkz. PublicGroupsDiscover). */}
      <PublicGroupsDiscover onJoined={onJoined} />
    </Animated.View>
  )
}

export default function GrubumScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const { userId } = useAuth()
  const grp = useGroups()
  const { state, getGroup, reload, joinGroup } = grp

  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Tek grup modeli: listenin ilk grubu "grubum"dur. (Eski çoklu-grup verisi
  // kalan hesaplarda da ilki gösterilir; Faz B'de backend tek grubu garantiler.)
  const myGroup = state.status === 'ready' ? (state.groups[0] ?? null) : null
  const myGroupId = myGroup?.id ?? null

  // Tam görünüm (üye listesi) sayfa düzeyinde, GroupHome ve edit sheet paylaşır.
  const [view, setView] = useState<ApiGroupView | null>(null)
  const [viewError, setViewError] = useState<string | null>(null)

  // Üye çıkarma / ad-logo kaydetme yanıtları tarihsiz döner (energyRatio yok);
  // halkalar sıfırlanmasın diye eldeki oranlar yeni görünüme taşınır.
  const applyView = useCallback((next: ApiGroupView) => {
    setView((prev) => {
      if (!prev) return next
      const known = new Map(prev.members.map((m) => [m.userId, m.energyRatio]))
      return {
        ...next,
        members: next.members.map((m) =>
          m.energyRatio == null ? { ...m, energyRatio: known.get(m.userId) ?? null } : m,
        ),
      }
    })
  }, [])

  // Yarış koruması: yalnızca en son başlatılan yüklemenin sonucu yazılır.
  const runId = useRef(0)
  const loadView = useCallback(
    async (id: string) => {
      const rid = ++runId.current
      setViewError(null)
      try {
        // Bugünün tarihiyle iste, üyeler günün enerji oranını (halka) taşısın.
        const v = await getGroup(id, todayISO())
        if (rid === runId.current) setView(v)
      } catch (e) {
        if (rid !== runId.current) return
        setViewError(groupErrorMessage(e, 'group'))
        // Üyelikten çıkarılmış olabiliriz, listeyi de tazele.
        if (e instanceof ApiError && e.status === 404) void reload()
      }
    },
    [getGroup, reload],
  )

  useEffect(() => {
    setView(null)
    if (myGroupId) void loadView(myGroupId)
  }, [myGroupId, loadView])

  // Grup daveti derin bağlantısı (afiet://katil/{code} · afiet.co/katil/{code}):
  // katil rotası kodu köprüye bırakır, Grubum burada tüketip koda katılır. Tek
  // grup kuralı backend'de: zaten gruptaysan joinGroup 409 döner, sakin mesaja
  // çevrilir. joinGroup listeyi dönen görünümden tazeler → grup bu sayfada
  // belirir (ekstra GET yok). Mount'ta bekleyeni tüket + sonradan (uygulama
  // açıkken) gelen daveti dinle.
  useEffect(() => {
    const runJoin = () => {
      const code = consumePendingJoin()
      if (!code) return
      joinGroup(code)
        .then(() => Alert.alert('Afiyet olsun 🍲', 'Gruba katıldın.'))
        .catch((e: unknown) => Alert.alert('Katılamadık', groupErrorMessage(e, 'join')))
    }
    runJoin()
    return onPendingJoin(runJoin)
  }, [joinGroup])

  // Besin eklenince (notify('meals')) üyelerin enerji halkaları bayatlar: öğün
  // değişimine abone ol ve aktif grubun date'li görünümünü yeniden çek. Grup
  // ekranı açıkken kullanıcı besin eklerse halkalar canlı güncellenir (mevcut
  // view korunur, spinner'a düşülmez; MemberRing yeni orana yeniden animasyonlar).
  useEffect(() => {
    if (!myGroupId) return
    return subscribe(['meals'], () => {
      void loadView(myGroupId)
    })
  }, [myGroupId, loadView])

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([reload(), myGroupId ? loadView(myGroupId) : Promise.resolve()])
    setRefreshing(false)
  }

  const spinnerColor = isDark ? '#34d399' : '#059669'

  // İlk grup yüklemesi sürerken tüm sayfayı iskeletle geç.
  if (state.status === 'loading') return <PageSkeleton />

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        refreshControl={
          state.status === 'ready' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refresh()}
              tintColor={spinnerColor}
            />
          ) : undefined
        }
      >
        <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
          <AppText weight="extrabold" className="text-2xl text-ink">
            Grubum
          </AppText>
          <AppText className="mt-1 text-sm text-soft">
            Dengeyi birlikte kovalayın
          </AppText>
        </AppHeader>

        {myGroup !== null && !view && !viewError && (
          <View className="flex-1 items-center justify-center pb-16">
            <ActivityIndicator color={spinnerColor} />
          </View>
        )}

        {state.status === 'error' && (
          <View className="rounded-2xl bg-surface p-5">
            <AppText className="mb-3 text-sm text-soft">{state.message}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void reload()}
              className="items-center rounded-xl bg-muted py-3"
            >
              <AppText weight="semibold" className="text-soft">
                Tekrar dene
              </AppText>
            </Pressable>
          </View>
        )}

        {state.status === 'ready' && myGroup === null && (
          <EmptyState
            onCreate={() => setCreateOpen(true)}
            onJoin={() => setJoinOpen(true)}
            onJoined={() => void reload()}
          />
        )}

        {state.status === 'ready' && myGroup !== null && viewError && (
          <View className="rounded-2xl bg-surface p-5">
            <AppText className="mb-3 text-sm text-soft">{viewError}</AppText>
            <Pressable
              accessibilityRole="button"
              onPress={() => void loadView(myGroup.id)}
              className="items-center rounded-xl bg-muted py-3"
            >
              <AppText weight="semibold" className="text-soft">
                Tekrar dene
              </AppText>
            </Pressable>
          </View>
        )}

        {state.status === 'ready' && myGroup !== null && view && (
          <GroupHome
            view={view}
            myUserId={userId}
            groups={grp}
            onViewChange={applyView}
            onEdit={() => setEditOpen(true)}
          />
        )}
      </ScrollView>

      <CreateGroupSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name, emoji) => {
          await grp.createGroup(name, emoji)
          // Pop-up yok: liste güncellenir, grup sayfada belirir.
        }}
      />
      <JoinGroupSheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoin={async (code) => {
          await grp.joinGroup(code)
          // Pop-up yok: liste güncellenir, grup sayfada belirir.
        }}
      />
      <GroupEditSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        view={view}
        myUserId={userId}
        groups={grp}
        onSaved={applyView}
        onReload={() => {
          if (myGroupId) void loadView(myGroupId)
        }}
      />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  )
}
