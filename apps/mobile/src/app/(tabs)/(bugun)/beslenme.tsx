import { MEAL_TYPES, formatLongTR, todayISO, type MealType } from '@afiet/core'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mealRepo } from '../../../data/repositories'
import { useLive } from '../../../data/useLive'
import { useTdee } from '@/features/body/useTdee'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { MacroProgressCard } from '@/features/nutrition/MacroProgressCard'
import { MealCard } from '@/features/nutrition/MealCard'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconChevronRight } from '@/ui/icons'

/** Beslenme — web NutritionPage.tsx portu (FirstVisitIntro Faz 10'da) */
export default function NutritionScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { id: profileId, profile } = useActiveProfile()
  const [addingTo, setAddingTo] = useState<MealType | null>(null)
  const date = todayISO()
  const tdeeValue = useTdee(profileId, profile ?? undefined)

  const entries =
    useLive(
      ['meals'],
      () => (profileId ? mealRepo.forDay(profileId, date) : Promise.resolve([])),
      [profileId, date],
    ) ?? []

  if (!profileId) return null

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <View className="mb-4 flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bugün ekranına dön"
            onPress={() => router.back()}
            className="-ml-2 h-9 w-9 items-center justify-center rounded-full"
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <IconChevronRight size={20} color={t.faint} />
            </View>
          </Pressable>
          <View>
            <View className="flex-row items-center gap-2">
              <IconBowl size={26} color={isDark ? '#34d399' : '#059669'} />
              <AppText weight="extrabold" className="text-2xl text-ink">
                Beslenme
              </AppText>
            </View>
            <AppText className="text-sm text-soft">{formatLongTR(date)}</AppText>
          </View>
        </View>

        <View className="gap-3">
          <MacroProgressCard entries={entries} tdeeValue={tdeeValue} />
          {MEAL_TYPES.map((m) => (
            <MealCard
              key={m.key}
              meal={m.key}
              entries={entries.filter((e) => e.meal === m.key)}
              onAdd={() => setAddingTo(m.key)}
            />
          ))}
        </View>
      </ScrollView>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        open={addingTo !== null}
        meal={addingTo}
        onClose={() => setAddingTo(null)}
      />
    </View>
  )
}
