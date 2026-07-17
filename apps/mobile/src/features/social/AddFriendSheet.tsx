import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { MemberRing } from '@/features/groups/MemberRing'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconSearch, IconUserPlus } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { acceptRequest, searchUsers, sendFriendRequest, useFriendRequests } from './mockStore'
import { openPublicProfile } from './PublicProfileCard'
import type { SocialProfile } from './types'

/**
 * Arkadaş ekle: @kullanıcı adıyla ara, sonuçları canlı listele. Her sonuç
 * enerji halkalı avatar + ad + duruma göre buton taşır (Ekle / Gönderildi /
 * Arkadaş / Kabul et). Sonuç satırına dokununca ortak profil kartı açılır.
 * MOCK: searchUsers backend gelince sunucu aramasına döner, imza aynı kalır.
 */

/** Sonucun arkadaşlık durumuna göre eylem butonu (sağda, dokunulabilir). */
function ResultButton({ profile }: { profile: SocialProfile }) {
  const { incoming } = useFriendRequests()

  const onAdd = () => {
    sendFriendRequest(profile.userId)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  const onAccept = () => {
    const req = incoming.find((r) => r.userId === profile.userId)
    if (!req) return
    acceptRequest(req.id)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  switch (profile.friendStatus) {
    case 'none':
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`@${profile.username} kişisine arkadaşlık isteği gönder`}
          onPress={onAdd}
          hitSlop={6}
          className="shrink-0 rounded-full bg-emerald-600 px-4 py-1.5 active:opacity-80"
        >
          <AppText weight="bold" className="text-xs text-white">
            Ekle
          </AppText>
        </Pressable>
      )
    case 'incoming':
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`@${profile.username} isteğini kabul et`}
          onPress={onAccept}
          hitSlop={6}
          className="shrink-0 rounded-full bg-emerald-600 px-4 py-1.5 active:opacity-80"
        >
          <AppText weight="bold" className="text-xs text-white">
            Kabul et
          </AppText>
        </Pressable>
      )
    case 'outgoing':
      return (
        <View className="shrink-0 rounded-full bg-muted px-4 py-1.5">
          <AppText weight="semibold" className="text-xs text-soft">
            Gönderildi
          </AppText>
        </View>
      )
    case 'friends':
      return (
        <View className="shrink-0 rounded-full bg-muted px-4 py-1.5">
          <AppText weight="semibold" className="text-xs text-soft">
            Arkadaş
          </AppText>
        </View>
      )
    case 'self':
      return null
  }
}

/** Tek arama sonucu satırı: avatar + ad/@kullanıcı + durum butonu. */
function ResultRow({ profile }: { profile: SocialProfile }) {
  const name = profile.displayName.trim()
  const initial = name ? (name[0]?.toUpperCase() ?? null) : null

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name || 'afiet arkadaşı'} profilini aç`}
      onPress={() => openPublicProfile(profile.userId)}
      className="flex-row items-center gap-3 py-2.5 active:opacity-70"
    >
      <MemberRing emoji={profile.emoji} initial={initial} ratio={profile.energyRatio} size={44} />
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {name || 'afiet arkadaşı'}
        </AppText>
        {profile.username ? (
          <AppText numberOfLines={1} className="text-xs text-soft">
            @{profile.username}
          </AppText>
        ) : null}
      </View>
      <ResultButton profile={profile} />
    </Pressable>
  )
}

export function AddFriendSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [query, setQuery] = useState('')

  // searchUsers anlık snapshot okur; sosyal durum değişince (istek gönder /
  // kabul) sonuç butonları tazelensin diye bu hook'la yeniden render'a abone
  // oluyoruz. Dönen değer parent'ta kullanılmıyor, abonelik yeterli.
  useFriendRequests()

  // Sheet her kapandığında aramayı sıfırla; tekrar açılınca temiz başlar.
  const seeded = useRef(false)
  useEffect(() => {
    if (!open) {
      seeded.current = false
      return
    }
    if (seeded.current) return
    seeded.current = true
    setQuery('')
  }, [open])

  const q = query.trim()
  const results = q ? searchUsers(q) : []

  return (
    <Sheet
      open={open}
      onClose={onClose}
      heightRatio={0.85}
      title={
        <>
          <IconUserPlus size={22} color={isDark ? '#34d399' : '#059669'} />
          <AppText weight="bold" className="text-lg text-ink">
            Arkadaş ekle
          </AppText>
        </>
      }
    >
      <AppText className="mb-3 text-sm text-soft">
        Kullanıcı adıyla ara, sofrana arkadaş kat.
      </AppText>

      <View className="flex-row items-center gap-2 rounded-xl border border-line px-3">
        <IconSearch size={20} color={t.faint} />
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="@kullanıcı adı"
          placeholderTextColor={t.faint}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="search"
          style={{
            flex: 1,
            paddingVertical: 12,
            fontFamily: 'Nunito_400Regular',
            fontSize: 16,
            color: t.ink,
          }}
        />
      </View>

      {q.length === 0 ? (
        <AppText className="py-10 text-center text-sm text-faint">
          Bir kullanıcı adı yazınca sonuçlar burada belirir 🌱
        </AppText>
      ) : results.length === 0 ? (
        <AppText className="py-10 text-center text-sm text-faint">
          Eşleşen kimse yok. Yazımını bir kez daha kontrol edebilirsin.
        </AppText>
      ) : (
        <View className="mt-2">
          {results.map((p, i) => (
            <View key={p.userId} className={i > 0 ? 'border-t border-line/60' : ''}>
              <ResultRow profile={p} />
            </View>
          ))}
        </View>
      )}
    </Sheet>
  )
}
