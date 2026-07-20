import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { MemberRing } from '@/features/groups/MemberRing'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconSearch, IconUserPlus } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import {
  acceptRequest,
  applyStatus,
  searchUsers,
  sendFriendRequest,
  useFriendRequests,
  useStoreTick,
} from './store'
import { normalizeFriendSearchQuery } from './friendSearchQuery'
import { openPublicProfile } from './PublicProfileCard'
import type { SocialProfile } from './types'

/**
 * Arkadaş ekle: @kullanıcı adıyla ara (gerçek sunucu araması, kısa gecikmeyle
 * borçlanır), sonuçları listele. Her sonuç enerji halkalı avatar + ad + duruma
 * göre buton taşır (Ekle / Gönderildi / Arkadaş / Kabul et); durum canlı depoyla
 * harmanlanır (applyStatus) ki istek gönderince buton anında değişsin. Sonuç
 * satırına dokununca ortak profil kartı açılır.
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
  const [results, setResults] = useState<SocialProfile[]>([])
  const [searching, setSearching] = useState(false)

  // İstek dilimini yükle + depo değişimlerine abone ol (istek gönder / kabul
  // edince sonuç butonları anında tazelensin). Dönen değer burada kullanılmıyor.
  useFriendRequests()
  useStoreTick()

  // Sheet açılınca aramayı sıfırla; tekrar açılınca temiz başlar.
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSearching(false)
    }
  }, [open])

  // Sorgu değiştikçe kısa gecikmeyle sunucuda ara (yazarken her tuşa istek atma).
  useEffect(() => {
    const q = normalizeFriendSearchQuery(query)
    if (q.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    let alive = true
    const handle = setTimeout(() => {
      searchUsers(q)
        .then((r) => {
          if (alive) {
            setResults(r)
            setSearching(false)
          }
        })
        .catch(() => {
          if (alive) {
            setResults([])
            setSearching(false)
          }
        })
    }, 250)
    return () => {
      alive = false
      clearTimeout(handle)
    }
  }, [query])

  const q = normalizeFriendSearchQuery(query)
  // Canlı durum overlay'ini uygula (buton "Gönderildi"/"Arkadaş" anında yansısın).
  const shown = results.map(applyStatus)

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

      {q.length < 2 ? (
        <AppText className="py-10 text-center text-sm text-faint">
          Bir kullanıcı adı yazınca sonuçlar burada belirir 🌱
        </AppText>
      ) : searching ? (
        <View className="items-center py-10">
          <ActivityIndicator color={isDark ? '#34d399' : '#059669'} />
        </View>
      ) : shown.length === 0 ? (
        <AppText className="py-10 text-center text-sm text-faint">
          Eşleşen kimse yok. Yazımını bir kez daha kontrol edebilirsin.
        </AppText>
      ) : (
        <View className="mt-2">
          {shown.map((p, i) => (
            <View key={p.userId} className={i > 0 ? 'border-t border-line/60' : ''}>
              <ResultRow profile={p} />
            </View>
          ))}
        </View>
      )}
    </Sheet>
  )
}
