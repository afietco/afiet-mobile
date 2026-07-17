import * as Haptics from 'expo-haptics'
import { Pressable, Text, View } from 'react-native'
import { isJoinedGroup, joinPublicGroup, usePublicGroups } from '@/features/social/mockStore'
import type { PublicGroup } from '@/features/social/types'
import { AppText } from '@/ui/AppText'

/**
 * Herkese açık grup keşfi. Grubu OLMAYAN kullanıcıya "Grubum" boş ekranında
 * kur/katıl seçeneklerinin altında gösterilir; her kart logo + ad + üye sayısı
 * + "Katıl" butonu taşır. Grubu olana bu bölüm hiç render edilmez (EmptyState
 * yalnızca grupsuz kullanıcıya çizildiğinden burada ekstra koşul gerekmez).
 *
 * MOCK: liste ve katılma bellek içi (features/social/mockStore). joinPublicGroup
 * şimdilik gerçek gruba SOKMAZ; yalnız optimistik "katıldın" işareti + üye sayısı
 * artışı verir. Gerçek keşif ucu backend ile geldiğinde bu buton gerçek katılmaya
 * bağlanacak. 8 haneli ID ile gerçek katılma akışı ayrıdır ve bu bölümden
 * bağımsız, bozulmadan durur.
 */

function DiscoverRow({ group }: { group: PublicGroup }) {
  const joined = isJoinedGroup(group.id)

  const onJoin = () => {
    joinPublicGroup(group.id)
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
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
      {joined ? (
        <View className="shrink-0 rounded-full bg-muted px-3.5 py-1.5">
          <AppText weight="semibold" className="text-xs text-soft">
            Katıldın ✓
          </AppText>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${group.name} grubuna katıl`}
          onPress={onJoin}
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

export function PublicGroupsDiscover() {
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
            <DiscoverRow group={g} />
          </View>
        ))}
      </View>
    </View>
  )
}
