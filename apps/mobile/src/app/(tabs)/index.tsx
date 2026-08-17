import { todayISO, type MealType } from '@afiet/core'
import { router, useIsFocused, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import * as Haptics from 'expo-haptics'
import type { ChapterKey } from '@/features/ftue/chapters'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AfiTodayNote } from '@/features/home/AfiTodayNote'
import { collectAfiMoments } from '@/features/home/afiMoment'
import { TodayBoard } from '@/features/home/TodayBoard'
import { TodayHeader } from '@/features/home/TodayHeader'
import { NutritionCard } from '@/features/home/NutritionCard'
import {
  ChapterOverlay,
  CloseDayCard,
  DirectionChapterCard,
  MenuChapterCard,
  RemindCard,
} from '@/features/ftue/chapter-views'
import { awayDaysOn } from '@/features/ftue/chapters'
import { useChapterSnapshot } from '@/features/ftue/chapter-store'
import { PieceLandedBanner, SofraSetupRow } from '@/features/ftue/sofra-setup'
import { useChapterFlow } from '@/features/ftue/useChapterFlow'
import { WidgetHintSheet } from '@/features/ftue/WidgetHintSheet'
import { BodySetupSheet } from '@/features/body/BodySetupSheet'
import { SofraSheet } from '@/features/nutrition/SofraSheet'
import type { SofraDraft } from '@/features/nutrition/sofra'
import { AppHeader } from '@/features/nav/AppHeader'
import { useTabBarSpace } from '@/features/nav/tabBarSpace'
import { DeferredAddFoodSheet } from '@/features/nutrition/DeferredAddFoodSheet'
import { useWaterTarget } from '@/features/body/useWaterTarget'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useRhythmWeek } from '@/features/sofra/useRhythmWeek'
import { consumePendingAdd, onPendingAdd } from '@/features/widget/pendingAdd'
import { syncWidget } from '@/features/widget/widgetBridge'
import { BrandHeader } from '@/ui/BrandHeader'
import { Confetti } from '@/ui/Confetti'
import { ScreenMotion } from '@/ui/motionGate'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { useSummaryResult } from '@/data/useSummary'
import { foodRepo, mealRepo, measurementRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { markFtueSeen, useFtueSeen } from '@/features/ftue/ftueFlags'
import { DirectionSheet } from '@/features/goals/DirectionSheet'
import { useGoalDirection } from '@/features/goals/useGoalDirection'

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
  /* The three sheets the chapters open. They live here rather than in the
     cards because a card unmounts the moment its chapter completes, and a
     sheet that vanishes with it would be cut off mid-close. */
  const [sofraOpen, setSofraOpen] = useState(false)
  /* Captured when the editor opens: the offer recomputes as the chapter
     completes, and a draft that changed under an open sheet would reseed it. */
  const [sofraDraft, setSofraDraft] = useState<SofraDraft | null>(null)
  const [sofraBuilding, setSofraBuilding] = useState(false)
  const [bodySetupOpen, setBodySetupOpen] = useState(false)
  const [widgetHintOpen, setWidgetHintOpen] = useState(false)
  const { record: chapterRecord } = useChapterSnapshot()
  /* The piece that just landed, named for a few seconds with confetti. */
  const [landed, setLanded] = useState<ChapterKey | null>(null)
  useEffect(() => {
    if (!landed) return
    const timer = setTimeout(() => setLanded(null), 5000)
    return () => clearTimeout(timer)
  }, [landed])
  const mealCardRef = useRef<View>(null)
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

  const hasBodyProfile = !!(
    profile?.sex &&
    profile.birthDate &&
    profile.heightCm &&
    profile.activityLevel
  )
  const mealsToday = summary
    ? summary.nutrition.knownCount + summary.nutrition.unknownCount
    : undefined
  /* The FTUE reads the same day the screen is already drawing, so it mounts no
     query of its own beyond the quest list its reward chapter needs. */
  const chapterFlow = useChapterFlow({
    profileId: profileId ?? 0,
    date,
    loggedDays: mealHistoryQuery.data?.length,
    mealsToday,
    unknownToday: summary ? summary.nutrition.unknownCount > 0 : undefined,
    hasBodyProfile,
  })
  /* Every ending a chapter reaches through this screen is celebrated here:
     the piece is named, the confetti falls, the new row arrives underneath. */
  const flow = {
    ...chapterFlow,
    complete: (key: ChapterKey) => {
      chapterFlow.complete(key)
      setLanded(key)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    },
  }

  /* "Sofranı kur": the repeated foods go into Menüm first, because a sofra is
     picked out of the menu, and then the editor opens with them ticked. A food
     already there is a success, not an error (saveCustom swallows the 409). */
  const buildSofra = () => {
    const draft = flow.sofraDraft
    if (!draft || sofraBuilding) return
    setSofraBuilding(true)
    setSofraDraft(draft)
    void (async () => {
      for (const food of draft.foods) {
        try {
          await foodRepo.saveCustom({
            name: food.name,
            groups: food.groups,
            measure: food.measure ?? undefined,
          })
        } catch {
          // The editor still opens; a food that could not be learned is simply unticked.
        }
      }
    })().finally(() => {
      setSofraBuilding(false)
      setSofraOpen(true)
    })
  }

  /* Afi reads the day and answers it, cycling through everything that is true
     right now. The note stands down while a chapter is on screen, because the
     chapter already has its own Afi on it. */
  const afiMoments =
    summary && flow.current === null
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
  /* The board is not held back by a timer any more: it arrives with the
     chapter that introduces it, and on its own by the second logged day if
     that chapter is never taken up. */
  const showFullHome = flow.doors.board
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
        scrollEnabled={flow.current !== 'balance'}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: tabBarSpace,
        }}
      >
        {/* Everything but the card a chapter points at steps back from the
            screen reader while that chapter is on screen. */}
        <View importantForAccessibility={flow.current === 'balance' ? 'no-hide-descendants' : 'auto'}>
          <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
            <BrandHeader />
          </AppHeader>
          <TodayHeader profile={profile} />
        </View>

        <View className="gap-3">
          <View ref={mealCardRef} collapsable={false}>
            <NutritionCard
              profileId={profileId}
              date={date}
              onAdd={() => setAdding(true)}
              /* Opening the detail is what finishes the first chapter: the
                 lesson is the group rings on the other side of this tap, and
                 a guide that only points at a card teaches where a button is
                 rather than what the app is for. */
              onOpenDetail={
                flow.current === 'balance' ? () => flow.complete('balance') : undefined
              }
            />
          </View>

          {landed ? <PieceLandedBanner chapter={landed} /> : null}
          <SofraSetupRow loggedDays={mealHistoryQuery.data.length} />

          {flow.current === 'closeDay' ? (
            <CloseDayCard
              profileId={profileId}
              date={date}
              mealsToday={mealsToday ?? 0}
              coveredGroups={summary.nutrition.balance.covered.length}
              flow={flow}
            />
          ) : null}
          {flow.current === 'menu' ? (
            <MenuChapterCard flow={flow} onBuild={buildSofra} building={sofraBuilding} />
          ) : null}
          {flow.current === 'direction' ? (
            <DirectionChapterCard flow={flow} onOpen={() => setBodySetupOpen(true)} />
          ) : null}
          {flow.current === 'remind' ? (
            <RemindCard
              flow={flow}
              awayDays={chapterRecord ? awayDaysOn(chapterRecord, date) : 0}
              onWidget={() => {
                setWidgetHintOpen(true)
                flow.complete('remind')
              }}
            />
          ) : null}

          {afiMoments.length > 0 ? (
            <View
              importantForAccessibility={
                flow.current === 'balance' ? 'no-hide-descendants' : 'auto'
              }
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
              doors={flow.doors}
            />
          ) : null}
        </View>
      </ScrollView>

      {landed ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Confetti />
        </View>
      ) : null}

      <DeferredAddFoodSheet
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

      <SofraSheet
        open={sofraOpen}
        initial={null}
        draft={sofraDraft}
        onClose={() => setSofraOpen(false)}
        onSaved={() => flow.complete('menu')}
      />
      <BodySetupSheet
        profile={profile}
        open={bodySetupOpen}
        onClose={() => setBodySetupOpen(false)}
        onSaved={() => flow.complete('direction')}
      />
      <WidgetHintSheet open={widgetHintOpen} onClose={() => setWidgetHintOpen(false)} />

      <ChapterOverlay
        flow={flow}
        mealCardRef={mealCardRef}
        paused={adding || sofraOpen || bodySetupOpen}
        unknownToday={summary.nutrition.unknownCount > 0}
      />
    </View>
  )
}

/* A render error here must not leave the tab blank with a working tab bar. */
export { ScreenErrorBoundary as ErrorBoundary } from '@/ui/ScreenErrorBoundary'
