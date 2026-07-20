import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { ApiError, type ApiGroupView } from '@/data/api/client'
import { joinPublicGroup, usePublicGroups } from '@/features/social/store'
import type { PublicGroup } from '@/features/social/types'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

/**
 * Public group discovery for users without a group. Every row shows identity,
 * member count, and a join action. The parent only renders this section in the
 * empty group state.
 *
 * Joining requires explicit data-sharing confirmation. A successful mutation
 * returns the full group view to the parent, which refreshes the shared group
 * store and replaces discovery with the group screen.
 */

/** Katılma hatasını sakin Türkçe metne çevir (gizli / yok / zaten grupta). */
function joinErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 403) return 'Bu grup artık herkese açık değil.'
    if (e.status === 404) return 'Bu grubu bulamadık, listedekilerden birini dene.'
    if (e.status === 409) return 'Zaten bir gruptasın, önce mevcut grubundan ayrılmalısın.'
  }
  return 'Bir şeyler ters gitti, birazdan tekrar dene.'
}

function DiscoverRow({
  group,
  onJoined,
}: {
  group: PublicGroup
  onJoined?: (view: ApiGroupView) => void
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [joining, setJoining] = useState(false)

  const joinConfirmed = async () => {
    if (joining) return
    setJoining(true)
    try {
      const view = await joinPublicGroup(group.id)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // The joined group replaces discovery after the parent applies the view.
      onJoined?.(view)
    } catch (e) {
      setJoining(false)
      Alert.alert('Katılamadın', joinErrorMessage(e))
    }
  }

  const confirmJoin = () => {
    if (joining) return
    Alert.alert(
      `“${group.name}” grubuna katıl?`,
      'Katılınca grup üyeleri enerji halkanı ve afiyet günlerini görebilir. Öğün detayların ve kilon paylaşılmaz. Görünürlüğünü daha sonra Grubum’dan kapatabilirsin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Katıl', onPress: () => void joinConfirmed() },
      ],
    )
  }

  return (
    <View className="flex-row items-center gap-3 py-3">
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/60">
        <Text style={{ fontSize: 24, lineHeight: 30 }}>{group.emoji ?? '🍲'}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <AppText weight="semibold" numberOfLines={1} className="text-ink">
          {group.name}
        </AppText>
        <AppText className="text-xs text-soft">{group.memberCount} üye</AppText>
      </View>
      {joining ? (
        <View className="shrink-0 px-3.5 py-1.5">
          <ActivityIndicator color={t.soft} />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${group.name} grubuna katıl`}
          onPress={confirmJoin}
          hitSlop={6}
          className="shrink-0 rounded-full bg-emerald-100 px-3.5 py-1.5 active:opacity-80 dark:bg-emerald-900/60"
        >
          <AppText weight="bold" className="text-xs text-emerald-800 dark:text-emerald-200">
            Katıl
          </AppText>
        </Pressable>
      )}
    </View>
  )
}

export function PublicGroupsDiscover({ onJoined }: { onJoined?: (view: ApiGroupView) => void }) {
  const groups = usePublicGroups()
  if (groups.length === 0) return null

  return (
    <View className="mt-8 rounded-2xl bg-surface p-5">
      <AppText weight="bold" className="text-ink">
        Herkese açık gruplar
      </AppText>
      <AppText className="mt-1 text-sm text-soft">
        Hazır sofralara göz at, istediğine katıl.
      </AppText>
      <View className="mt-2">
        {groups.map((g, i) => (
          <View key={g.id} className={i > 0 ? 'border-t border-line/60' : ''}>
            <DiscoverRow group={g} onJoined={onJoined} />
          </View>
        ))}
      </View>
    </View>
  )
}
