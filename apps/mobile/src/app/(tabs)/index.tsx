import { todayISO, type MealType } from '@afiet/core'
import { router, useIsFocused, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AfiTodayNote } from '@/features/home/AfiTodayNote'
import { collectAfiMoments } from '@/features/home/afiMoment'
import { TodayBoard } from '@/features/home/TodayBoard'
import { TodayHeader } from '@/features/home/TodayHeader'
import { BodySetupSheet } from '@/features/body/BodySetupSheet'
import { MeasurementSheet } from '@/features/body/MeasurementSheet'
import { NutritionCard } from '@/features/home/NutritionCard'
import { TodayAfiGuide, type TodayAfiGuideState } from '@/features/ftue/today-afi-guide'
import { AppHeader } from '@/features/nav/AppHeader'
import { useTabBarSpace } from '@/features/nav/tabBarSpace'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { useWaterTarget } from '@/features/body/useWaterTarget'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useRhythmWeek } from '@/features/sofra/useRhythmWeek'
import { consumePendingAdd, onPendingAdd } from '@/features/widget/pendingAdd'
import { syncWidget } from '@/features/widget/widgetBridge'
import { BrandHeader } from '@/ui/BrandHeader'
import { ScreenMotion } from '@/ui/motionGate'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { useSummaryResult } from '@/data/useSummary'
import { mealRepo, measurementRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { markFtueSeen, useFtueSeen } from '@/features/ftue/ftueFlags'
import { DirectionSheet } from '@/features/goals/DirectionSheet'
import { useGoalDirection } from '@/features/goals/useGoalDirection'
import { shouldShowFocusedHome } from '@/features/home/homeVisibility'

/**
 * Age of the last measurement in days.
 *
 * Three states have to stay apart: the query has not answered yet (0, so the
 * note never invites on a guess), there has never been a measurement (null,
 * which is the invitation), and there is one (its age).
 */
function daysSinceMeasurement(latest: { date: string } | null | undefined): number | null {
  if (latest === undefined) return 0
  if (latest === null) return null
  const taken = Date.parse(`${latest.date}T00:00:00`)
  if (!Number.isFinite(taken)) return 0
  const today = Date.parse(`${todayISO()}T00:00:00`)
  return Math.max(0, Math.round((today - taken) / 86_400_000))
}

/**
 * A tab screen stays mounted after you leave it, so it has to say when it is
 * actually being looked at. Everything that loops underneath (Afi, the rhythm
 * pulse, the skeleton shimmer, the note rotation) rests while you are on
 * another tab. See ui/motionGate.
 */
export default function TodayScreen() {
  const isFocused = useIsFocused()
  return (
    <ScreenMotion active={isFocused}>
      <TodayScreenContent />
    </ScreenMotion>
  )
}

/** Bugün; kart panosu. UI revizyonu: Beslenme kartı renkli kahraman kalır;
    altında Vücudum + Su minimal ikili, ardından Menüm + Grubum ikilisi. */
function TodayScreenContent() {
  const { pushTarget } = useLocalSearchParams<{ pushTarget?: string | string[] }>()
  const insets = useSafeAreaInsets()
  const tabBarSpace = useTabBarSpace()
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [requiresMealSelection, setRequiresMealSelection] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [directionOpen, setDirectionOpen] = useState(false)
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
  const latestMeasurement = useLive(
    ['measurements'],
    () => (profileId ? measurementRepo.latest(profileId) : Promise.resolve(null)),
    [profileId],
  )
  const mealHistoryQuery = useLive(
    ['meals'],
    () => (profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId],
  )
  const hasMealRecord =
    firstMealCelebrated || (mealHistoryQuery.data?.length ?? 0) > 0
  /* The direction is asked during body setup now, so anyone who walked through
     it arrives here with one and never sees this offer. What is left is the
     catch-up: accounts that finished setup before the question existed have no
     direction and were never asked, and silently defaulting them forever would
     be the one dishonest option. So the offer survives for exactly them, once,
     and Vücudum keeps a standing "Yönüm" row for anyone who scrolled past it.

     The choice retires the offer, not the flag alone: however someone came by
     a direction, they have learned the thing this teaches. Waiting for the
     stored log to load matters too, because an unread log looks exactly like
     an unchosen one, and the offer would flash at a new user for a frame. */
  const guideDone = useFtueSeen('afiGuideDone')
  const goalDirectionTaught = useFtueSeen('goalDirectionTaught')
  const { isDefault: goalDirectionUnchosen, loading: goalDirectionLoading } = useGoalDirection()
  const teachGoalDirection =
    guideDone &&
    hasMealRecord &&
    !goalDirectionTaught &&
    !goalDirectionLoading &&
    goalDirectionUnchosen

  /* Afi reads the day and answers it, cycling through everything that is true
     right now. The note stands down while the guide is running, because the
     guide already has its own Afi on screen. */
  const afiMoments =
    summary && !guideState.active
      ? collectAfiMoments({
          hour: new Date().getHours(),
          mealsToday: summary.nutrition.knownCount + summary.nutrition.unknownCount,
          missingGroups: summary.nutrition.balance.missing,
          sweetCount: summary.nutrition.balance.sweetCount,
          fastfoodCount: summary.nutrition.balance.fastfoodCount,
          waterGlasses: summary.water.glasses,
          waterTarget: summary.water.target,
          streak: summary.streak,
          daysSinceMeasurement: daysSinceMeasurement(latestMeasurement.data),
          neverLogged: (mealHistoryQuery.data?.length ?? 0) === 0,
          teachGoalDirection: teachGoalDirection,
        })
      : []
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
          paddingBottom: tabBarSpace,
        }}
      >
        <View
          importantForAccessibility={guideState.active ? 'no-hide-descendants' : 'auto'}
        >
          <AppHeader onOpenNotifications={() => setNotifOpen(true)} showKese>
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
          {afiMoments.length > 0 ? (
            <View
              importantForAccessibility={guideState.active ? 'no-hide-descendants' : 'auto'}
            >
              <AfiTodayNote
              moments={afiMoments}
              onAddMeal={() => setAdding(true)}
              onOpenBody={() => router.push('/vucudum')}
              onOpenGoals={() => {
                /* Taking the offer is what retires it. Marking it on render
                   would spend the one chance on a note that rotated past
                   unseen. */
                markFtueSeen('goalDirectionTaught')
                setDirectionOpen(true)
              }}
            />
            </View>
          ) : null}
          {showFullHome ? (
            <TodayBoard
              profileId={profileId}
              profile={profile}
              date={date}
              waterTarget={waterTarget}
              guideActive={guideState.active}
              guideStep={
                guideState.step === 'water' || guideState.step === 'body'
                  ? guideState.step
                  : null
              }
              onGuideBodyPress={() => {
                if (hasBodyProfile) setGuideMeasurementOpen(true)
                else setGuideBodySetupOpen(true)
              }}
              waterRef={waterTargetRef}
              bodyRef={bodyTargetRef}
            />
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

      {/* Afi's one question, asked where the offer was made. Sheets position
          absolutely, so it lives at the screen root rather than in the note. */}
      <DirectionSheet open={directionOpen} onClose={() => setDirectionOpen(false)} />

      <BodySetupSheet
        profile={profile}
        open={guideBodySetupOpen}
        onSaved={() => {
          setGuideBodySetupOpen(false)
          setGuideMeasurementOpen(true)
        }}
        onClose={() => setGuideBodySetupOpen(false)}
      />
      <MeasurementSheet
        profileId={profileId}
        sex={profile.sex}
        open={guideMeasurementOpen}
        guideMode
        onSaved={() => setGuideMeasurementOpen(false)}
        onClose={() => setGuideMeasurementOpen(false)}
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

/* A render error here must not leave the tab blank with a working tab bar. */
export { ScreenErrorBoundary as ErrorBoundary } from '@/ui/ScreenErrorBoundary'
