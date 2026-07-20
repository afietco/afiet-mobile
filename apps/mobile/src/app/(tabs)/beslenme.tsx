import { formatLongTR, todayISO, type MealType } from '@afiet/core'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mealRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useSummary } from '@/data/useSummary'
import { AppHeader } from '@/features/nav/AppHeader'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { MacroProgressCard } from '@/features/nutrition/MacroProgressCard'
import { MealBoard } from '@/features/nutrition/MealBoard'
import { GuideShortcutCard, MenuShortcutCard } from '@/features/nutrition/NutritionShortcuts'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { RhythmHistoryCard } from '@/features/sofra/RhythmHistoryCard'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl } from '@/ui/icons'
import { PageSkeleton } from '@/ui/PageSkeleton'

/** Beslenme; artık üst düzey sekme. UI revizyonu: Afiyet ritmi kartı buraya
    taşındı; öğünler tek satırlık kolay-ekleme tasarımına (MealBoard) geçti;
    enerji & makrolar ile Besin Rehberi + Menüm kısayolları aynen korundu. */
export default function NutritionScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const { id: profileId } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const date = todayISO()
  const summary = useSummary(date)

  const entries =
    useLiveValue(
      ['meals'],
      () => (profileId ? mealRepo.forDay(profileId, date) : Promise.resolve([])),
      [profileId, date],
    ) ?? []

  if (!profileId || summary === undefined) return <PageSkeleton />

  const openAdd = (meal: MealType | null) => {
    setAddMeal(meal)
    setAdding(true)
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
          <View className="flex-row items-center gap-2">
            <IconBowl size={26} color={isDark ? '#34d399' : '#059669'} />
            <AppText weight="extrabold" className="text-2xl text-ink">
              Beslenme
            </AppText>
          </View>
          <AppText className="text-sm text-soft">{formatLongTR(date)}</AppText>
        </AppHeader>

        <View className="gap-3">
          {summary && <MacroProgressCard summary={summary} />}

          {/* Öğünler; tek satır, kolay ekleme (eski 2×2 ızgaranın yerine) */}
          <MealBoard
            entries={entries}
            onAddMeal={(m) => openAdd(m)}
            onQuickAdd={() => openAdd(null)}
          />

          {/* Afiyet ritmin; Geçmiş sayfasından buraya taşındı */}
          <RhythmHistoryCard className="" />

          {/* Besin Rehberi + Menüm kısayol çifti (aynen) */}
          <View className="flex-row gap-3">
            <GuideShortcutCard />
            <MenuShortcutCard />
          </View>
        </View>
      </ScrollView>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        open={adding}
        meal={addMeal}
        onClose={() => {
          setAdding(false)
          setAddMeal(null)
        }}
      />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  )
}
