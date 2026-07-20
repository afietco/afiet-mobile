import { MEAL_TYPES, addDays, todayISO } from '@afiet/core'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mealRepo, waterRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useSummary } from '@/data/useSummary'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { MealIcon } from '@/ui/appIcons'
import { IconDrop, IconRepeat } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/* Habits focuses on personal logging patterns derived from real meal and water
   data. The seven-day logging rhythm is separate from the balance rhythm on
   the Nutrition screen. */

export default function AliskanliklarimScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const sky = isDark ? '#38bdf8' : '#0284c7'
  const { id: profileId } = useActiveProfile()
  const today = todayISO()
  const from7 = addDays(today, -6)
  const from30 = addDays(today, -29)

  const meals7 =
    useLiveValue(
      ['meals'],
      () => (profileId ? mealRepo.forRange(profileId, from7, today) : Promise.resolve([])),
      [profileId, from7, today],
    ) ?? []
  const meals30 =
    useLiveValue(
      ['meals'],
      () => (profileId ? mealRepo.forRange(profileId, from30, today) : Promise.resolve([])),
      [profileId, from30, today],
    ) ?? []
  const water7 =
    useLiveValue(
      ['water'],
      () => (profileId ? waterRepo.forRange(profileId, from7, today) : Promise.resolve([])),
      [profileId, from7, today],
    ) ?? []
  const summary = useSummary(today)

  if (!profileId || summary === undefined) return <PageSkeleton />

  const loggedDates7 = new Set(meals7.map((meal) => meal.date))
  const daysLogged7 = loggedDates7.size
  const recentDates = Array.from({ length: 7 }, (_, index) => addDays(from7, index))
  const mealCounts = MEAL_TYPES.map((m) => ({
    key: m.key,
    label: m.label,
    count: meals30.filter((e) => e.meal === m.key).length,
  }))
  const topMeal = mealCounts.reduce((a, b) => (b.count > a.count ? b : a))
  const maxMeal = Math.max(1, ...mealCounts.map((x) => x.count))
  const avgGlasses = Math.round((water7.reduce((s, w) => s + w.glasses, 0) / 7) * 10) / 10
  const hasMeals = meals30.length > 0

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader
          title="Alışkanlıklarım"
          subtitle="Kayıt düzenin ve tercihlerin"
          icon={<IconRepeat size={24} color={sky} />}
        />

        <View className="gap-3">
          {/* Seven-day logging rhythm without streak or reset semantics. */}
          <View
            accessible
            accessibilityLabel={`Son 7 günde ${daysLogged7} gün kayıt tuttun`}
            className="rounded-2xl bg-surface p-5"
          >
            <View className="flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <AppText weight="bold" className="text-ink">
                  Haftalık ritmin
                </AppText>
                <AppText className="mt-1 text-xs text-soft">Son 7 gündeki kayıt düzenin</AppText>
              </View>
              <View className="rounded-full bg-emerald-50 px-3 py-1.5 dark:bg-emerald-950/50">
                <AppText weight="extrabold" className="text-base text-emerald-800 dark:text-emerald-200">
                  {daysLogged7} gün
                </AppText>
              </View>
            </View>
            <View className="mt-4 flex-row justify-between px-1">
              {recentDates.map((date) => (
                <View
                  key={date}
                  className={`h-3 w-3 rounded-full ${
                    loggedDates7.has(date) ? 'bg-emerald-400' : 'bg-muted'
                  }`}
                />
              ))}
            </View>
            <AppText className="mt-3 text-xs leading-5 text-faint">
              Kayıt tuttuğun günler birikir; aradaki boş günler önceki kayıtlarını silmez.
            </AppText>
          </View>

          {/* Öğün tercihi */}
          <View className="rounded-2xl bg-surface p-5">
            <AppText weight="bold" className="text-ink">
              Öğün tercihin
            </AppText>
            {hasMeals ? (
              <>
                <View className="mt-3 flex-row items-center gap-3">
                  <View className="h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <MealIcon meal={topMeal.key} size={24} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <AppText weight="extrabold" className="text-lg text-ink">
                      {topMeal.label}
                    </AppText>
                    <AppText className="text-sm text-soft">
                      Son 30 günde en çok kaydettiğin öğün
                    </AppText>
                  </View>
                </View>
                <View className="mt-3 gap-2">
                  {mealCounts.map((mc) => (
                    <View key={mc.key} className="flex-row items-center gap-2">
                      <AppText className="w-16 text-xs text-soft">{mc.label}</AppText>
                      <View className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <View
                          className="h-full rounded-full bg-indigo-400"
                          style={{ width: `${(mc.count / maxMeal) * 100}%` }}
                        />
                      </View>
                      <AppText className="w-8 text-right text-xs text-faint">{mc.count}</AppText>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View className="mt-2 flex-row items-center gap-3">
                <AfiPose pose="merak" size={52} />
                <AppText className="flex-1 text-sm text-soft">
                  Besin ekledikçe hangi öğünü daha çok kaydettiğin burada belirir 🍽️
                </AppText>
              </View>
            )}
          </View>

          {/* Su alışkanlığı */}
          <View className="rounded-2xl bg-surface p-5">
            <View className="flex-row items-center gap-2">
              <IconDrop size={20} color={sky} />
              <AppText weight="bold" className="text-ink">
                Su alışkanlığın
              </AppText>
            </View>
            <View className="mt-2 flex-row items-baseline gap-1.5">
              <AppText weight="extrabold" className="text-3xl text-ink">
                {avgGlasses}
              </AppText>
              <AppText weight="semibold" className="text-sm text-soft">
                bardak / gün
              </AppText>
            </View>
            <AppText className="mt-1 text-xs text-faint">Son 7 günün günlük ortalaması.</AppText>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
