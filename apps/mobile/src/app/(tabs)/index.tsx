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
import { WeekCloseCelebration } from '@/features/sofra/WeekCloseCelebration'
import { useRhythmWeek } from '@/features/sofra/useRhythmWeek'
import { useWeekClosure } from '@/features/sofra/useWeekClosure'
import { consumePendingAdd, onPendingAdd } from '@/features/widget/pendingAdd'
import { syncWidget } from '@/features/widget/widgetBridge'
import { BrandHeader } from '@/ui/BrandHeader'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { useSummary } from '@/data/useSummary'

/** Bugün — kart panosu. UI revizyonu: Beslenme kartı renkli kahraman kalır;
    altında Vücudum + Su minimal ikili, ardından Menüm + Grubum ikilisi. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const [addMeal, setAddMeal] = useState<MealType | null>(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const date = todayISO()
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)
  // Hafta kapanışı: hedefe ulaşan hafta bittiğinde Afi kutlaması (bir kez).
  const { closure, ack } = useWeekClosure()
  const week = useRhythmWeek(date)
  // Sayfa (kart) verisi backend'den gelene dek tüm sayfayı iskeletle geç.
  const summary = useSummary(date)

  // Widget köprüsü: ritim haftası her tazelendiğinde anlık görüntü yazılır.
  useEffect(() => {
    if (week && profileId) void syncWidget(profileId, week, date)
  }, [week, date, profileId])

  // Widget derin bağlantısı (afiet://ekle?ogun=...): öğün önseçili sheet aç.
  useEffect(() => {
    const openPending = () => {
      const meal = consumePendingAdd()
      if (meal) {
        setAddMeal(meal)
        setAdding(true)
      }
    }
    openPending()
    return onPendingAdd(openPending)
  }, [])

  if (!profileId || summary === undefined) return <PageSkeleton />

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        {/* Yazı-logo + tagline (BRAND.md wordmark) solda; sağda sofra kesesi ·
            bildirim · hamburger yardımcı üçlüsü */}
        <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
          <BrandHeader />
        </AppHeader>

        <TodayHeader profile={profile ?? undefined} />

        <View className="gap-3">
          <StarterTasksCard profileId={profileId} onAddFood={() => setAdding(true)} />
          <NutritionCard
            profileId={profileId}
            profile={profile ?? undefined}
            date={date}
            onAdd={() => setAdding(true)}
          />
          {/* Vücudum + Su — yarıya inmiş minimal ikili */}
          <View className="flex-row gap-3">
            <BodyMiniCard profileId={profileId} profile={profile ?? undefined} />
            <WaterMiniCard profileId={profileId} date={date} target={waterTarget} />
          </View>
          {/* Menüm + Grubum — yeni ikili */}
          <View className="flex-row gap-3">
            <MenuShortcutCard />
            <GroupMiniCard />
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

      {closure ? <WeekCloseCelebration closure={closure} onClose={ack} /> : null}
    </View>
  )
}
