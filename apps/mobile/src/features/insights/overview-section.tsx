import { CORE_GROUPS, FOOD_GROUPS, addDays, todayISO, type FoodGroup } from '@afiet/core'
import { ScrollView, View } from 'react-native'
import { mealRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'

/* Thirty-day balance overview derived from the user's meal records. */

const WINDOW = 30
const groupLabel = (g: FoodGroup) => FOOD_GROUPS.find((x) => x.key === g)?.label ?? g

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-surface p-4">
      <AppText weight="extrabold" className="text-2xl text-ink">
        {value}
      </AppText>
      <AppText className="mt-0.5 text-xs text-soft">{label}</AppText>
    </View>
  )
}

export function OverviewSection() {
  const { id: profileId } = useActiveProfile()
  const today = todayISO()
  const from = addDays(today, -(WINDOW - 1))

  const mealsQuery = useLive(
    ['meals'],
    () => (profileId ? mealRepo.forRange(profileId, from, today) : Promise.resolve([])),
    [profileId, from, today],
  )
  const mealsRaw = mealsQuery.data
  const meals = mealsRaw ?? []

  if (!profileId || mealsRaw === undefined)
    return <PageSkeleton error={mealsQuery.error} onRetry={mealsQuery.retry} />

  const counts = CORE_GROUPS.map((g) => ({
    g,
    count: meals.filter((m) => m.groups.includes(g)).length,
  }))
  const maxCount = Math.max(1, ...counts.map((c) => c.count))
  const touched = counts.filter((c) => c.count > 0).length
  const distinctDays = new Set(meals.map((m) => m.date)).size
  const totalEntries = meals.length

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        {totalEntries === 0 ? (
          <View className="items-center rounded-2xl bg-surface p-5">
            <AfiPose pose="merak" size={88} />
            <AppText className="mt-2 text-center text-sm text-soft">
              Son {WINDOW} günde kayıt yok. Besin ekledikçe besin grubu dağılımın ve
              istatistiklerin burada belirir 🌱
            </AppText>
          </View>
        ) : (
          <View className="gap-3">
            {/* The food-group distribution is the overview's primary visual. */}
            <View className="rounded-2xl bg-surface p-5">
              <View className="mb-3 flex-row items-center justify-between">
                <AppText weight="bold" className="text-ink">
                  Besin grubu dağılımı
                </AppText>
                <View className="rounded-full bg-violet-50 px-2.5 py-1 dark:bg-violet-950/50">
                  <AppText weight="bold" className="text-xs text-violet-700 dark:text-violet-300">
                    {touched}/5 grup 🌈
                  </AppText>
                </View>
              </View>
              <View className="gap-3">
                {counts.map(({ g, count }) => (
                  <View key={g} className="flex-row items-center gap-3">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <GroupIcon group={g} size={18} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <View className="mb-1 flex-row items-center justify-between">
                        <AppText weight="semibold" className="text-sm text-ink">
                          {groupLabel(g)}
                        </AppText>
                        <AppText className="text-xs text-faint">{count} kayıt</AppText>
                      </View>
                      <View className="h-2 overflow-hidden rounded-full bg-muted">
                        <View
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              <AppText className="mt-3 text-xs text-faint">
                Çubuklar son {WINDOW} günde her temel gruba kaç kez dokunduğunu gösterir —
                sıralama değil, denge pusulası. 💛
              </AppText>
            </View>

            {/* Compact supporting totals. */}
            <View className="flex-row gap-3">
              <StatBox label="Kayıtlı gün" value={String(distinctDays)} />
              <StatBox label="Toplam kayıt" value={String(totalEntries)} />
              <StatBox label="Dokunulan grup" value={`${touched}/5`} />
            </View>
          </View>
        )}
    </ScrollView>
  )
}
