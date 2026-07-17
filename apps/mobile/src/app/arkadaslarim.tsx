import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AddFriendSheet } from '@/features/social/AddFriendSheet'
import { FriendRow } from '@/features/social/FriendRow'
import {
  acceptRequest,
  cancelRequest,
  declineRequest,
  useFriendRequests,
  useFriends,
} from '@/features/social/mockStore'
import { openPublicProfile } from '@/features/social/PublicProfileCard'
import type { FriendRequest } from '@/features/social/types'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconUserPlus, IconUsers, IconX } from '@/ui/icons'
import { ScreenHeader } from '@/ui/ScreenHeader'

/* Arkadaşlarım (hamburger › /arkadaslarim). Bekleyen istekler (gelen üstte,
   giden altta), arkadaş listesi (enerji halkalı) ve boş durum. Arkadaşlık
   çift onaylı; tüm veriler MOCK (bkz. features/social/mockStore). Satıra
   dokunmak ortak profil kartını açar (openPublicProfile). */

/** İstek satırlarındaki düz avatar: henüz arkadaş değiliz, enerji halkası yok. */
function Avatar({ emoji, initial }: { emoji: string | null; initial: string | null }) {
  return (
    <View className="h-11 w-11 items-center justify-center rounded-full bg-muted">
      {emoji ? (
        <Text style={{ fontSize: 20, lineHeight: 26 }}>{emoji}</Text>
      ) : (
        <AppText weight="bold" className="text-soft">
          {initial ?? '·'}
        </AppText>
      )}
    </View>
  )
}

/** Gelen istek: kabul et / reddet. */
function IncomingRow({ req }: { req: FriendRequest }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const name = req.displayName.trim()
  const initial = name ? (name[0]?.toUpperCase() ?? null) : null

  const onAccept = () => {
    acceptRequest(req.id)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name || 'afiet arkadaşı'} profilini aç`}
      onPress={() => openPublicProfile(req.userId)}
      className="flex-row items-center gap-3 py-2.5 active:opacity-70"
    >
      <Avatar emoji={req.emoji} initial={initial} />
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {name || 'afiet arkadaşı'}
        </AppText>
        {req.username ? (
          <AppText numberOfLines={1} className="text-xs text-soft">
            @{req.username}
          </AppText>
        ) : null}
      </View>
      <View className="shrink-0 flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="İsteği reddet"
          onPress={() => declineRequest(req.id)}
          hitSlop={6}
          className="h-9 w-9 items-center justify-center rounded-full bg-muted active:opacity-80"
        >
          <IconX size={18} color={t.soft} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="İsteği kabul et"
          onPress={onAccept}
          hitSlop={6}
          className="h-9 items-center justify-center rounded-full bg-emerald-600 px-4 active:opacity-80"
        >
          <AppText weight="bold" className="text-xs text-white">
            Kabul et
          </AppText>
        </Pressable>
      </View>
    </Pressable>
  )
}

/** Giden istek: yanıt bekliyor, geri alınabilir. */
function OutgoingRow({ req }: { req: FriendRequest }) {
  const name = req.displayName.trim()
  const initial = name ? (name[0]?.toUpperCase() ?? null) : null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name || 'afiet arkadaşı'} profilini aç`}
      onPress={() => openPublicProfile(req.userId)}
      className="flex-row items-center gap-3 py-2.5 active:opacity-70"
    >
      <Avatar emoji={req.emoji} initial={initial} />
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {name || 'afiet arkadaşı'}
        </AppText>
        <AppText numberOfLines={1} className="text-xs text-soft">
          İstek gönderildi
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="İsteği geri al"
        onPress={() => cancelRequest(req.id)}
        hitSlop={6}
        className="shrink-0 rounded-full bg-muted px-4 py-1.5 active:opacity-80"
      >
        <AppText weight="semibold" className="text-xs text-soft">
          Geri al
        </AppText>
      </Pressable>
    </Pressable>
  )
}

/** Arkadaşın yokken sakin karşılama + arkadaş ekleme çağrısı. */
function EmptyFriends({ onAdd }: { onAdd: () => void }) {
  const { isDark } = useTheme()
  const emerald = isDark ? '#34d399' : '#059669'

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className="items-center rounded-2xl bg-surface p-8"
    >
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-100 dark:bg-emerald-900/60">
        <IconUsers size={40} color={emerald} strokeWidth={1.6} />
      </View>
      <AppText weight="extrabold" className="text-center text-lg text-ink">
        Sofran biraz sessiz 🌿
      </AppText>
      <AppText className="mt-2 max-w-xs text-center text-sm text-soft">
        Kullanıcı adıyla arkadaş ekle; enerji halkalarını ve afiyet günlerini
        birlikte görün.
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        className="mt-5 flex-row items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 active:opacity-90"
      >
        <IconUserPlus size={18} color="#ffffff" />
        <AppText weight="semibold" className="text-white">
          Arkadaş ekle
        </AppText>
      </Pressable>
    </Animated.View>
  )
}

export default function ArkadaslarimScreen() {
  const insets = useSafeAreaInsets()
  const friends = useFriends()
  const { incoming, outgoing } = useFriendRequests()
  const [addOpen, setAddOpen] = useState(false)

  const hasPending = incoming.length > 0 || outgoing.length > 0

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader title="Arkadaşlarım" subtitle="Sofra arkadaşların ve istekler" />

        <Pressable
          accessibilityRole="button"
          onPress={() => setAddOpen(true)}
          className="mb-4 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 active:opacity-90"
        >
          <IconUserPlus size={20} color="#ffffff" />
          <AppText weight="bold" className="text-white">
            Arkadaş ekle
          </AppText>
        </Pressable>

        {hasPending && (
          <Animated.View
            entering={FadeInDown.duration(250)}
            className="mb-4 rounded-2xl bg-surface p-5"
          >
            {incoming.length > 0 && (
              <>
                <AppText weight="bold" className="mb-1 text-ink">
                  Sana gelen istekler
                </AppText>
                <View>
                  {incoming.map((r, i) => (
                    <View key={r.id} className={i > 0 ? 'border-t border-line/60' : ''}>
                      <IncomingRow req={r} />
                    </View>
                  ))}
                </View>
              </>
            )}
            {outgoing.length > 0 && (
              <>
                <AppText
                  weight="bold"
                  className={`mb-1 text-ink ${incoming.length > 0 ? 'mt-4' : ''}`}
                >
                  Gönderdiğin istekler
                </AppText>
                <View>
                  {outgoing.map((r, i) => (
                    <View key={r.id} className={i > 0 ? 'border-t border-line/60' : ''}>
                      <OutgoingRow req={r} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </Animated.View>
        )}

        {friends.length > 0 ? (
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="rounded-2xl bg-surface p-5"
          >
            <AppText weight="bold" className="mb-1 text-ink">
              Arkadaşların
            </AppText>
            <AppText className="mb-2 text-xs text-soft">{friends.length} kişi</AppText>
            <View>
              {friends.map((f, i) => (
                <View key={f.userId} className={i > 0 ? 'border-t border-line/60' : ''}>
                  <FriendRow friend={f} />
                </View>
              ))}
            </View>
          </Animated.View>
        ) : (
          <EmptyFriends onAdd={() => setAddOpen(true)} />
        )}
      </ScrollView>

      <AddFriendSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  )
}
