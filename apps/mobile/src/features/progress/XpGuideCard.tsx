/**
 * The points dictionary, folded away until asked for.
 *
 * Collapsed by default because it answers a question people only ask once, and
 * the screen's first job is still "where am I this month". Open, it is the
 * only place in the app that says what anything is worth.
 */
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { XP_GUIDE_INTRO, xpGuideLines } from './xpGuide'

export function XpGuideCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [open, setOpen] = useState(false)
  const lines = xpGuideLines()

  return (
    <View className="mt-3 rounded-2xl bg-surface">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Puan nasıl kazanılır, aç"
        onPress={() => setOpen(!open)}
        className="min-h-11 flex-row items-center gap-3 p-4"
      >
        <AppText weight="bold" className="min-w-0 flex-1 text-sm text-ink">
          Puan nasıl kazanılır?
        </AppText>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
          <IconChevronRight size={18} color={t.faint} />
        </View>
      </Pressable>

      {open ? (
        <View className="px-4 pb-4">
          <AppText className="mb-3 text-xs leading-5 text-faint">{XP_GUIDE_INTRO}</AppText>
          <View className="gap-2.5">
            {lines.map((line) => (
              <View key={line.source} className="flex-row items-baseline gap-3">
                <View className="min-w-0 flex-1">
                  <AppText className="text-sm text-ink">{line.label}</AppText>
                  <AppText className="text-xs text-faint">{line.limit}</AppText>
                </View>
                <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-300">
                  +{line.amount}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}
