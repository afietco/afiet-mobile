import {
  findSeedFood,
  formatLongTR,
  todayISO,
  type MealEntry,
  type MealType,
  type SeedFood,
} from '@afiet/core'
import { useIsFocused } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mealRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useSummaryResult } from '@/data/useSummary'
import { NutritionChatCard, SupportChatRow } from '@/features/chat/entryCards'
import { AppHeader } from '@/features/nav/AppHeader'
import { useTabBarSpace } from '@/features/nav/tabBarSpace'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { AfiNutritionNote } from '@/features/nutrition/AfiNutritionNote'
import { buildNutritionMoments } from '@/features/nutrition/afiNutritionMoment'
import { FoodDetailSheet } from '@/features/nutrition/FoodDetailSheet'
import { MacroProgressCard } from '@/features/nutrition/MacroProgressCard'
import { MealBoard } from '@/features/nutrition/MealBoard'
import { MealDetailSheet } from '@/features/nutrition/MealDetailSheet'
import { GuideShortcutCard, MenuShortcutCard } from '@/features/nutrition/NutritionShortcuts'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { RhythmHistoryCard } from '@/features/sofra/RhythmHistoryCard'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl } from '@/ui/icons'
import { ScreenMotion } from '@/ui/motionGate'
import { useTextScale } from '@/ui/textScale'
import { PageSkeleton } from '@/ui/PageSkeleton'

const NO_MISSING_GROUPS: string[] = []

/**
 * Beslenme, a top level tab.
 *
 * Afi opens the page with what today's plate actually warrants, the meal row
 * stays compact and opens a meal rather than adding to it, and every add walks
 * the one stepped flow behind the single "Besin Ekle" button. The macro card
 * carries the day's balance, now measured against the goal engine rather than
 * the backend's percentage split. The Besin Rehberi + Menüm shortcuts are
 * unchanged; the week's rhythm closes the page.
 */
/**
 * A tab screen stays mounted after you leave it, so it has to say when it is
 * actually being looked at; everything that loops underneath rests otherwise.
 * See ui/motionGate.
 */
export default function NutritionScreen() {
  const isFocused = useIsFocused()
  return (
    <ScreenMotion active={isFocused}>
      <NutritionScreenContent />
    </ScreenMotion>
  )
}

function NutritionScreenContent() {
  const { hidesDecoration } = useTextScale()
  const insets = useSafeAreaInsets()
  const tabBarSpace = useTabBarSpace()
  const { isDark } = useTheme()
  const { id: profileId } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [openMeal, setOpenMeal] = useState<MealType | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [openFood, setOpenFood] = useState<SeedFood | null>(null)
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null)
  const date = todayISO()
  const summaryQuery = useSummaryResult(date)
  const summary = summaryQuery.data

  const entries =
    useLiveValue(
      ['meals'],
      () => (profileId ? mealRepo.forDay(profileId, date) : Promise.resolve([])),
      [profileId, date],
    ) ?? []

  /* Rebuilt only when the plate or the balance moves, not on every live tick.
     The hour is read once per build on purpose: Afi's line may lag the clock by
     a render, which is invisible, and reading it during render keeps the note a
     pure function of what is on screen. */
  const missingGroups = summary?.nutrition.balance.missing ?? NO_MISSING_GROUPS
  const moments = useMemo(
    () =>
      buildNutritionMoments({
        hour: new Date().getHours(),
        entries,
        missingGroups,
      }),
    [entries, missingGroups],
  )

  /* Without a way out, a summary that fails or never settles left this tab on a
     bare skeleton for good: switching tabs did not clear it, because the screen
     stays mounted. The skeleton now times out into the recoverable error state,
     the same as Bugün. */
  if (!profileId || summary === undefined)
    return <PageSkeleton error={summaryQuery.error} onRetry={summaryQuery.retry} />

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
          paddingBottom: tabBarSpace,
        }}
      >
        <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
          {/* The icon steps aside once the text is large: side by side
              they left the title a column too narrow to hold its own
              word, so "Beslenme" was breaking in half. */}
          <View className="flex-row items-center gap-2">
            {hidesDecoration ? null : <IconBowl size={26} color={isDark ? '#34d399' : '#059669'} />}
            <AppText weight="extrabold" className="text-2xl text-ink">
              Beslenme
            </AppText>
          </View>
          <AppText className="text-sm text-soft">{formatLongTR(date)}</AppText>
        </AppHeader>

        <View className="gap-3">
          {/* Afi opens the page, the same presence Bugün has, speaking about
              the plate rather than the whole day. */}
          <AfiNutritionNote
            moments={moments}
            onAddFood={() => openAdd(null)}
            /* Afi only ever names a food the catalogue carries, so this
               resolves; the guard is for a catalogue that moved under a
               moment built one render earlier. */
            onOpenFood={(name) => setOpenFood(findSeedFood(name) ?? null)}
          />

          {/* The day's energy and macro compass. What was eaten comes from the
              record, what it is measured against from the goal engine. */}
          {summary && <MacroProgressCard summary={summary} entries={entries} />}

          {/* Öğünler; one compact row. A meal chip OPENS that meal, and the
              header pill is the single way into the add flow. */}
          <MealBoard
            entries={entries}
            onOpenMeal={(m) => setOpenMeal(m)}
            onAddFood={() => openAdd(null)}
          />

          {/* Besin Rehberi + Menüm shortcuts; both are entry points into food
              data, so they sit with the meals rather than after the history. */}
          <View className="flex-row gap-3">
            <GuideShortcutCard />
            <MenuShortcutCard />
          </View>

          {/* The weekly conversation sits by the retrospective it feeds on. */}
          <NutritionChatCard />

          {/* Afiyet ritmin; the week's retrospective closes the page. */}
          <RhythmHistoryCard className="" />

          {/* A quiet doorway, after everything else: food talk is not always
              about food. */}
          <SupportChatRow />
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
      {/* Tapping a meal chip opens what is in that meal, not the add form. */}
      <MealDetailSheet
        profileId={profileId}
        date={date}
        meal={openMeal}
        open={openMeal !== null}
        onClose={() => setOpenMeal(null)}
        onAddFood={openAdd}
        onEditEntry={setEditingEntry}
      />
      {/* Editing keeps its own single form: an edit has no decisions left to
          walk through, so it never enters the stepped flow. */}
      {editingEntry ? (
        <AddFoodSheet
          profileId={profileId}
          date={editingEntry.date}
          open
          meal={null}
          initialEntry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      ) : null}
      {/* Afi'nin övdüğü besnin detayı; rehberdeki kartın aynısı. */}
      <FoodDetailSheet food={openFood} onClose={() => setOpenFood(null)} />
      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  )
}

/* A render error here must not leave the tab blank with a working tab bar. */
export { ScreenErrorBoundary as ErrorBoundary } from '@/ui/ScreenErrorBoundary'
