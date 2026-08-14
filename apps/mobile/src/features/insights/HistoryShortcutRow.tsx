import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconCalendar } from '@/ui/icons'

/**
 * The way into the full record, on the Beslenme tab.
 *
 * It used to be a link at the bottom of the rhythm card, under the weeks,
 * which is the last thing on the page: somebody looking for last Tuesday had
 * to scroll past everything else to find out where it lives. It now sits above
 * the guide and the menu, with the other doorways.
 *
 * Written in the Today board's row language rather than as a link, because
 * that is what it now is: a chip, a title, a value on the right, no chevron.
 */
export function HistoryShortcutRow() {
  const { isDark } = useTheme()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Bilgilerim: tüm geçmişini aç"
      onPress={() => router.push('/bilgilerim')}
      className="flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 active:bg-muted"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
        <IconCalendar size={20} color={isDark ? '#a78bfa' : '#7c3aed'} />
      </View>
      <AppText weight="bold" className="text-ink">
        Bilgilerim
      </AppText>
      <View className="ml-auto flex-row items-center gap-2 pl-3">
        <AppText numberOfLines={1} className="text-sm text-soft">
          Tüm geçmişin
        </AppText>
      </View>
    </Pressable>
  )
}
