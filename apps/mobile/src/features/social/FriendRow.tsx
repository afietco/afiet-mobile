import { ActivityIndicator, Pressable, View } from 'react-native'
import { MemberRing } from '@/features/groups/MemberRing'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconTrash } from '@/ui/icons'
import { openPublicProfile } from './PublicProfileCard'
import type { Friend } from './types'

/**
 * Arkadaş listesi satırı: enerji halkalı avatar, ad + @kullanıcı adı ve bugün
 * afiyetteyse sakin bir pırıltı. Satıra dokununca ortak profil kartı açılır
 * (openPublicProfile, _layout'taki tek global sheet). Enerji halkası
 * GroupHome'daki üye avatarıyla aynı dili taşır (MemberRing size 44).
 */
interface FriendRowProps {
  friend: Friend
  onRemove: () => void
  removing: boolean
  removeDisabled: boolean
}

export function FriendRow({ friend, onRemove, removing, removeDisabled }: FriendRowProps) {
  const { isDark } = useTheme()
  const name = friend.displayName.trim()
  const initial = name ? (name[0]?.toUpperCase() ?? null) : null

  return (
    <View className="flex-row items-center gap-2 py-2.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name || 'afiet arkadaşı'} profilini aç`}
        onPress={() => openPublicProfile(friend.userId)}
        className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-70"
      >
        <MemberRing emoji={friend.emoji} initial={initial} ratio={friend.energyRatio} size={44} />
        <View className="min-w-0 flex-1">
          <AppText weight="semibold" numberOfLines={1} className="text-ink">
            {name || 'afiet arkadaşı'}
          </AppText>
          {friend.username ? (
            <AppText numberOfLines={1} className="text-xs text-soft">
              @{friend.username}
            </AppText>
          ) : null}
        </View>
        {friend.afiyetToday ? (
          <AppText className="shrink-0 text-xs text-emerald-700 dark:text-emerald-300">
            bugün afiyette ✨
          </AppText>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name || 'afiet arkadaşını'} arkadaşlıktan çıkar`}
        accessibilityState={{ busy: removing, disabled: removeDisabled }}
        disabled={removeDisabled}
        hitSlop={6}
        onPress={onRemove}
        className="h-11 w-11 shrink-0 items-center justify-center rounded-full active:bg-rose-100 disabled:opacity-50 dark:active:bg-rose-950/50"
      >
        {removing ? (
          <ActivityIndicator size="small" color={isDark ? '#fb7185' : '#e11d48'} />
        ) : (
          <IconTrash size={18} color={isDark ? '#fb7185' : '#e11d48'} />
        )}
      </Pressable>
    </View>
  )
}
