import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { ApiError, type ApiGroupView } from '@/data/api/client'
import { joinPublicGroup, usePublicGroups } from '@/features/social/store'
import type { PublicGroup } from '@/features/social/types'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCheck } from '@/ui/icons'

/**
 * Public group discovery: identity, member count, and a way in.
 *
 * Joining requires explicit data-sharing confirmation. A successful mutation
 * hands the full group view to the parent, which refreshes the shared store.
 *
 * A row reaches its OWN end state rather than waiting to be unmounted. It used
 * to assume the parent would replace it the moment a join landed, which was
 * true while this sat inline on the empty group screen and stopped being true
 * the day it moved inside a sheet: the join worked, the screen behind changed,
 * and the row went on spinning in a sheet nobody had closed. What a row does
 * after a successful write cannot depend on what its parent decides to do.
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
  const [status, setStatus] = useState<'idle' | 'joining' | 'joined'>('idle')
  const joining = status === 'joining'

  const joinConfirmed = async () => {
    if (status !== 'idle') return
    setStatus('joining')
    try {
      const view = await joinPublicGroup(group.id)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      /* Settled before the parent is told, so the row is truthful whatever the
         parent does with the news: closes over it, swaps the screen behind it,
         or nothing at all. */
      setStatus('joined')
      onJoined?.(view)
    } catch (e) {
      setStatus('idle')
      Alert.alert('Katılamadın', joinErrorMessage(e))
    }
  }

  const confirmJoin = () => {
    if (status !== 'idle') return
    /* The tap, not the outcome: the consent dialog it opens is a step people
       back out of, and that drop-off is the thing worth seeing. */
    trackTap('group_join_submit', { via: 'public' })
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
      {status === 'joined' ? (
        <View className="shrink-0 flex-row items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5">
          <IconCheck size={13} color="#ffffff" strokeWidth={2.6} />
          <AppText weight="bold" className="text-xs text-white">
            Katıldın
          </AppText>
        </View>
      ) : joining ? (
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
  const { groups, failed, reload } = usePublicGroups()
  /* An empty list is only worth hiding when it is the truth. When the request
     failed, hiding is what left a new account staring at no groups at all with
     nothing to press. */
  if (groups.length === 0 && !failed) return null

  return (
    <View className="mt-8 rounded-2xl bg-surface p-5">
      <AppText weight="bold" className="text-ink">
        Herkese açık gruplar
      </AppText>
      <AppText className="mt-1 text-sm text-soft">
        Hazır sofralara göz at, istediğine katıl.
      </AppText>
      {failed ? (
        <View className="mt-3 items-start">
          <AppText className="text-sm text-soft">
            Grupları şu an getiremedim.
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Herkese açık grupları yeniden getir"
            onPress={reload}
            className="mt-2 rounded-xl bg-emerald-100 px-4 py-2 active:opacity-80 dark:bg-emerald-900/60"
          >
            <AppText weight="bold" className="text-sm text-emerald-800 dark:text-emerald-200">
              Tekrar dene
            </AppText>
          </Pressable>
        </View>
      ) : null}
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
