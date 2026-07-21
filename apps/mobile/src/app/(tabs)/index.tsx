import { todayISO, type MealType } from '@afiet/core'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TodayHeader } from '@/features/home/TodayHeader'
import { BodySetupSheet } from '@/features/body/BodySetupSheet'
import { MeasurementSheet } from '@/features/body/MeasurementSheet'
import { BodyMiniCard } from '@/features/home/BodyMiniCard'
import { GroupMiniCard } from '@/features/home/GroupMiniCard'
import { WaterMiniCard } from '@/features/home/WaterMiniCard'
import { NutritionCard } from '@/features/home/NutritionCard'
import { TodayAfiGuide, type TodayAfiGuideState } from '@/features/ftue/today-afi-guide'
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
  const { pushTarget } = useLocalSearchParams<{ pushTarget?: string | string[] }>()
  const insets = useSafeAreaInsets()
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [requiresMealSelection, setRequiresMealSelection] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [guideBodySetupOpen, setGuideBodySetupOpen] = useState(false)
  const [guideMeasurementOpen, setGuideMeasurementOpen] = useState(false)
  const [guideState, setGuideState] = useState<TodayAfiGuideState>({
    active: false,
    step: null,
  })
  const mealTargetRef = useRef<View>(null)
  const waterTargetRef = useRef<View>(null)
  const bodyTargetRef = useRef<View>(null)
  const updateGuideState = useCallback((next: TodayAfiGuideState) => {
    setGuideState((current) =>
      current.active === next.active && current.step === next.step ? current : next,
    )
  }, [])
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
  const showFullHome = !focusedHome || guideState.active
  const hasBodyProfile = !!(
    profile?.sex &&
    profile.birthDate &&
    profile.heightCm &&
    profile.activityLevel
  )
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

  useEffect(() => {
    const target = Array.isArray(pushTarget) ? pushTarget[0] : pushTarget
    if (!target) return
    const frame = requestAnimationFrame(() => {
      if (target === 'meal') {
        setAddMeal(null)
        setRequiresMealSelection(true)
        setAdding(true)
      } else if (target === 'notifications') {
        setNotifOpen(true)
      }
      router.setParams({ pushTarget: '' })
    })
    return () => cancelAnimationFrame(frame)
  }, [pushTarget])

  if (!profileId || !profile || summary === undefined || mealHistoryQuery.data === undefined)
    return <PageSkeleton error={pageError} onRetry={retryPage} />

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        scrollEnabled={!guideState.active}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <View
          importantForAccessibility={guideState.active ? 'no-hide-descendants' : 'auto'}
        >
          <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
            <BrandHeader />
          </AppHeader>
          <TodayHeader profile={profile} />
        </View>

        <View className="gap-3">
          <View
            ref={mealTargetRef}
            collapsable={false}
            importantForAccessibility={
              guideState.active && guideState.step !== 'meal' ? 'no-hide-descendants' : 'auto'
            }
          >
            <NutritionCard
              profileId={profileId}
              date={date}
              onAdd={() => setAdding(true)}
              guideActive={guideState.step === 'meal'}
            />
          </View>
          {showFullHome ? (
            <>
              <View className="flex-row gap-3">
                <BodyMiniCard
                  ref={bodyTargetRef}
                  profileId={profileId}
                  profile={profile}
                  guideHidden={
                    guideState.active && guideState.step !== 'body'
                  }
                  onPress={
                    guideState.step === 'body'
                      ? () => {
                          if (hasBodyProfile) setGuideMeasurementOpen(true)
                          else setGuideBodySetupOpen(true)
                        }
                      : undefined
                  }
                />
                <WaterMiniCard
                  ref={waterTargetRef}
                  profileId={profileId}
                  date={date}
                  target={waterTarget}
                  guideActive={guideState.step === 'water'}
                  guideHidden={
                    guideState.active && guideState.step !== 'water'
                  }
                />
              </View>
              <View
                className="flex-row gap-3"
                importantForAccessibility={
                  guideState.active ? 'no-hide-descendants' : 'auto'
                }
              >
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

      <BodySetupSheet
        profile={profile}
        open={guideBodySetupOpen}
        guideMode
        onSaved={() => {
          setGuideBodySetupOpen(false)
          setGuideMeasurementOpen(true)
        }}
        onClose={() => undefined}
      />
      <MeasurementSheet
        profileId={profileId}
        sex={profile.sex}
        open={guideMeasurementOpen}
        guideMode
        onSaved={() => setGuideMeasurementOpen(false)}
        onClose={() => undefined}
      />

      <TodayAfiGuide
        profileId={profileId}
        profileCreatedAt={profile.createdAt}
        targets={{ meal: mealTargetRef, water: waterTargetRef, body: bodyTargetRef }}
        onStateChange={updateGuideState}
        paused={adding || guideBodySetupOpen || guideMeasurementOpen}
      />
    </View>
  )
}
