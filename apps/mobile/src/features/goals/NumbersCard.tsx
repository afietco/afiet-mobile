import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChart, IconChevronRight } from '@/ui/icons'

/**
 * "Sayılarla": the door to the grams and the kcal.
 *
 * This was a full width collapsible whose body carried the goal target and the
 * whole body data panel. It now stands next to "Yönüm" as one of two cards, and
 * half a screen is not a place to unfold three macro boxes, a BMI bar and a
 * trend chart: opening it in place would either clip the numbers or shove the
 * pair apart every time someone tapped. So the card kept the doorway and gave
 * up the room, and the numbers open on `/veri`, a route that already renders
 * exactly that panel full screen and stays reachable from push notifications.
 *
 * The face carries no figure on purpose. Section 2 of docs/hedeflerim.md keeps
 * grams and kcal visible but never primary, and section 12 says the person opens
 * them if they want them. A kcal range printed here would hand someone a number
 * they never asked for, which is the one thing this section exists not to do.
 *
 * The anatomy (icon tile, bold title, one quiet line) mirrors `DirectionRow` so
 * the two cards read as a pair rather than as two strangers.
 */
export function NumbersCard({ className }: { className?: string }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sayılarla"
      accessibilityHint="Gram, kalori ve BMI'yi veri ekranında açar"
      onPress={() => router.push('/veri')}
      className={`rounded-2xl bg-surface p-4 active:opacity-80 ${className ?? ''}`}
    >
      <View className="flex-row items-start justify-between">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-900/50">
          <IconChart size={22} color={violet} />
        </View>
        <IconChevronRight size={18} color={t.faint} />
      </View>
      <AppText weight="bold" className="mt-2.5 text-ink">
        Sayılarla
      </AppText>
      <AppText className="mt-0.5 text-xs leading-4 text-soft">
        Gram, kalori ve BMI merak edersen burada
      </AppText>
    </Pressable>
  )
}
