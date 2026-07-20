import { todayISO, type MealType } from '@afiet/core'
import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TodayHeader } from '@/features/home/TodayHeader'
import { BodyMiniCard } from '@/features/home/BodyMiniCard'
import { GroupMiniCard } from '@/features/home/GroupMiniCard'
import { WaterMiniCard } from '@/features/home/WaterMiniCard'
import { NutritionCard } from '@/features/home/NutritionCard'
import { StarterTasksCard } from '@/features/ftue/StarterTasksCard'
import { AppHeader } from '@/features/nav/AppHeader'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { MenuShortcutCard } from '@/features/nutrition/NutritionShortcuts'
import { useWaterTarget } from '@/features/body/useWaterTarget'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useRhythmWeek } from '@/features/sofra/useRhythmWeek'
import { consumePendingAdd, onPendingAdd } from '@/features/widget/pendingAdd'
import { syncWidget } from '@/features/widget/widgetBridge'
import { BrandHeader } from '@/ui/BrandHeader'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { useSummaryResult } from '@/data/useSummary'
import { mealRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useFtueSeen } from '@/features/ftue/ftueFlags'
import { shouldShowFocusedHome } from '@/features/home/homeVisibility'

/** Bugün; kart panosu. UI revizyonu: Beslenme kartı renkli kahraman kalır;
    altında Vücudum + Su minimal ikili, ardından Menüm + Grubum ikilisi. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [requiresMealSelection, setRequiresMealSelection] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const date = todayISO()
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)
  const week = useRhythmWeek(date)
  const summaryQuery = useSummaryResult(date)
  const summary = summaryQuery.data
  const firstMealCelebrated = useFtueSeen('firstMealCelebrated')
  const mealHistoryQuery = useLive(
    ['meals'],
    () => (profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId],
  )
  const hasMealRecord =
    firstMealCelebrated || (mealHistoryQuery.data?.length ?? 0) > 0
  const focusedHome = profile
    ? shouldShowFocusedHome({ profileCreatedAt: profile.createdAt, hasMealRecord })
    : false
  const pageError = summaryQuery.error ?? mealHistoryQuery.error
  const retryPage = () => {
    summaryQuery.retry()
    mealHistoryQuery.retry()
  }

  // Refresh the widget snapshot whenever the rhythm week changes.
  useEffect(() => {
    if (week && profileId) void syncWidget(profileId, week, date)
  }, [week, date, profileId])

  // Consume the widget deep link once and open the add-food sheet safely.
  useEffect(() => {
    const openPending = () => {
      const request = consumePendingAdd()
      if (request) {
        setAddMeal(request.meal)
        setRequiresMealSelection(request.requiresMealSelection)
        setAdding(true)
      }
    }
    openPending()
    return onPendingAdd(openPending)
  }, [])

  if (!profileId || summary === undefined || mealHistoryQuery.data === undefined)
    return <PageSkeleton error={pageError} onRetry={retryPage} />

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        {/* Brand content stays left; notification and menu actions stay right. */}
        <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
          <BrandHeader />
        </AppHeader>

        <TodayHeader profile={profile ?? undefined} />

        <View className="gap-3">
          <NutritionCard
            profileId={profileId}
            date={date}
            onAdd={() => setAdding(true)}
          />
          <StarterTasksCard profileId={profileId} onAddFood={() => setAdding(true)} />
          {!focusedHome ? (
            <>
              {/* Vücudum + Su; yarıya inmiş minimal ikili */}
              <View className="flex-row gap-3">
                <BodyMiniCard profileId={profileId} profile={profile ?? undefined} />
                <WaterMiniCard profileId={profileId} date={date} target={waterTarget} />
              </View>
              {/* Menüm + Grubum; yeni ikili */}
              <View className="flex-row gap-3">
                <MenuShortcutCard />
                <GroupMiniCard />
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        open={adding}
        meal={addMeal}
        requireMealSelection={requiresMealSelection}
        onClose={() => {
          setAdding(false)
          setAddMeal(null)
          setRequiresMealSelection(false)
        }}
      />

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  )
}
