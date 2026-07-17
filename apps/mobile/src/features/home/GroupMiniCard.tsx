import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useGroups } from '@/features/groups/useGroups'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconUsers } from '@/ui/icons'

/**
 * Bugün panosunun Grubum kartı (yarım genişlik). Grubu olana grubun adını
 * gösterir; olmayana "gruba katıl" teşviki. Dokununca Grubum sekmesine gider.
 * Tek grup modeli: listenin ilk grubu kullanıcının grubudur.
 */
export function GroupMiniCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const emerald = isDark ? '#34d399' : '#059669'
  const { state } = useGroups()
  const myGroup = state.status === 'ready' ? (state.groups[0] ?? null) : null
  const loading = state.status === 'loading'

  return (
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
      {loading ? (
        <AppText className="text-xs text-faint">…</AppText>
      ) : myGroup ? (
        <AppText numberOfLines={1} className="text-xs text-soft">
          {myGroup.name}
        </AppText>
      ) : (
        <AppText weight="semibold" className="text-xs text-emerald-700 dark:text-emerald-300">
          Bir gruba katıl →
        </AppText>
      )}
    </Pressable>
  )
}
