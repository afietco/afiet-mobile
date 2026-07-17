import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useGroups } from '@/features/groups/useGroups'
import { useFriends } from '@/features/social/store'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconUsers } from '@/ui/icons'

/**
 * Profil ekranının sosyal kısayol ikilisi: Arkadaşlarım (sofra arkadaşı sayısı,
 * dokununca /arkadaslarim) ve Grubum (grubun adı, dokununca /grubum; grubun
 * yoksa katılma teşviki). Sayılar GERÇEK backend'den gelir (useFriends /
 * useGroups); yüklenirken sakin bir "…", boşsa nazik bir çağrı gösterilir.
 * Bugün panosundaki mini kartların diliyle aynı: ikon köşesi + chevron.
 */
export function ProfileSocialRow({ today }: { today: string }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'

  const friendsView = useFriends(today)
  const friendCount = friendsView.status === 'ready' ? friendsView.friends.length : null

  const { state } = useGroups()
  const myGroup = state.status === 'ready' ? (state.groups[0] ?? null) : null
  const groupLoading = state.status === 'loading'

  return (
    <View className="mt-4 flex-row gap-3">
      {/* Arkadaşlarım kısayolu */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          friendCount != null ? `Arkadaşlarım: ${friendCount} kişi` : 'Arkadaşlarım'
        }
        onPress={() => router.push('/arkadaslarim')}
        className="flex-1 rounded-2xl bg-surface p-4 active:opacity-80"
      >
        <View className="flex-row items-center justify-between">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
            <IconUsers size={20} color={emerald} />
          </View>
          <IconChevronRight size={16} color={t.faint} />
        </View>
        <AppText weight="bold" className="mt-2 text-ink">
          Arkadaşlarım
        </AppText>
        {friendCount == null ? (
          <AppText className="text-xs text-faint">…</AppText>
        ) : friendCount > 0 ? (
          <AppText numberOfLines={1} className="text-xs text-soft">
            {friendCount} sofra arkadaşı
          </AppText>
        ) : (
          <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
            Arkadaş ekle →
          </AppText>
        )}
      </Pressable>

      {/* Grubum kısayolu */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={myGroup ? `Grubum: ${myGroup.name}` : 'Bir gruba katıl'}
        onPress={() => router.push('/grubum')}
        className="flex-1 rounded-2xl bg-surface p-4 active:opacity-80"
      >
        <View className="flex-row items-center justify-between">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
            {myGroup?.emoji ? (
              <Text style={{ fontSize: 18, lineHeight: 24 }}>{myGroup.emoji}</Text>
            ) : (
              <IconUsers size={20} color={emerald} />
            )}
          </View>
          <IconChevronRight size={16} color={t.faint} />
        </View>
        <AppText weight="bold" className="mt-2 text-ink">
          Grubum
        </AppText>
        {groupLoading ? (
          <AppText className="text-xs text-faint">…</AppText>
        ) : myGroup ? (
          <AppText numberOfLines={1} className="text-xs text-soft">
            {myGroup.name}
          </AppText>
        ) : (
          <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
            Gruba katıl →
          </AppText>
        )}
      </Pressable>
    </View>
  )
}
