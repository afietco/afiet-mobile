import { todayISO } from '@afiet/core'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TodayHeader } from '@/features/home/TodayHeader'
import { BodyCard } from '@/features/home/BodyCard'
import { NutritionCard } from '@/features/home/NutritionCard'
import { StarterTasksCard } from '@/features/ftue/StarterTasksCard'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { WaterCounter } from '@/features/nutrition/WaterCounter'
import { useWaterTarget } from '@/features/body/useWaterTarget'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { WeekCloseCelebration } from '@/features/sofra/WeekCloseCelebration'
import { useWeekClosure } from '@/features/sofra/useWeekClosure'
import { BrandHeader } from '@/ui/BrandHeader'

/** Bugün — kart panosu (web HomePage.tsx portu). BodyCard Faz 9'da,
    StarterTasksCard Faz 10'da eklenecek. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const date = todayISO()
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)
  // Hafta kapanışı: hedefe ulaşan hafta bittiğinde Afi kutlaması (bir kez).
  const { closure, ack } = useWeekClosure()

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
        {/* Yazı-logo + tagline — kalıcı başlık (BRAND.md wordmark referansı) */}
        <View className="mb-4">
          <BrandHeader />
        </View>

        <TodayHeader profile={profile ?? undefined} onNotifications={() => setNotifOpen(true)} />

        <View className="gap-3">
          <StarterTasksCard profileId={profileId} onAddFood={() => setAdding(true)} />
          <NutritionCard
            profileId={profileId}
            profile={profile ?? undefined}
            date={date}
            onAdd={() => setAdding(true)}
          />
          <BodyCard profileId={profileId} profile={profile ?? undefined} />
          <WaterCounter profileId={profileId} date={date} target={waterTarget} />
        </View>
      </ScrollView>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        open={adding}
        meal={null}
        onClose={() => setAdding(false)}
      />

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />

      {closure ? <WeekCloseCelebration closure={closure} onClose={ack} /> : null}
    </View>
  )
}
