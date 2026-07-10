import { todayISO } from '@afiet/core'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TodayHeader } from '@/features/home/TodayHeader'
import { BodyCard } from '@/features/home/BodyCard'
import { NutritionCard } from '@/features/home/NutritionCard'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { WaterCounter } from '@/features/nutrition/WaterCounter'
import { useWaterTarget } from '@/features/body/useWaterTarget'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { BrandHeader } from '@/ui/BrandHeader'
import { IconBook, IconChevronRight } from '@/ui/icons'

/** Bugün — kart panosu (web HomePage.tsx portu). BodyCard Faz 9'da,
    StarterTasksCard Faz 10'da eklenecek. */
export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const date = todayISO()
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)

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

        <TodayHeader profileId={profileId} profile={profile ?? undefined} />

        <View className="gap-3">
          <NutritionCard
            profileId={profileId}
            profile={profile ?? undefined}
            date={date}
            onAdd={() => setAdding(true)}
          />
          <BodyCard profileId={profileId} profile={profile ?? undefined} />
          <WaterCounter profileId={profileId} date={date} target={waterTarget} />
          <Link href="/besinler" asChild>
            <Pressable className="flex-row items-center justify-between rounded-2xl bg-surface p-4">
              <View className="flex-row items-center gap-2.5">
                <IconBook size={22} color={isDark ? '#34d399' : '#059669'} />
                <View>
                  <AppText weight="bold" className="text-ink">
                    Besin Rehberi
                  </AppText>
                  <AppText className="text-sm text-soft">
                    Listedeki besinleri ve yaklaşık değerlerini incele
                  </AppText>
                </View>
              </View>
              <IconChevronRight size={20} color={t.faint} />
            </Pressable>
          </Link>
          {__DEV__ && (
            <Link href="/debug" asChild>
              <Pressable className="flex-row items-center justify-between rounded-2xl border border-dashed border-line px-5 py-4">
                <AppText weight="semibold" className="text-soft">
                  Veri katmanı testi (dev)
                </AppText>
                <IconChevronRight size={18} color={t.faint} />
              </Pressable>
            </Link>
          )}
        </View>
      </ScrollView>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        open={adding}
        meal={null}
        onClose={() => setAdding(false)}
      />
    </View>
  )
}
