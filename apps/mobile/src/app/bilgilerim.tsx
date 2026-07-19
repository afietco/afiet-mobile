import { CORE_GROUPS, FOOD_GROUPS, addDays, todayISO, type FoodGroup } from '@afiet/core'
import { ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mealRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon } from '@/ui/appIcons'
import { IconChart } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { ScreenHeader } from '@/ui/ScreenHeader'

/* Bilgilerim — istatistiki bir bakış (hamburger menüden). Odak: besin grubu
   dağılımı (kullanıcı tercihi). Veri gerçek — son 30 günün kayıtlarından
   türetilir; kalori/yargı değil, denge pusulası. */

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

export default function BilgilerimScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const violet = isDark ? '#a78bfa' : '#7c3aed'
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
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <ScreenHeader
          title="Bilgilerim"
          subtitle={`Son ${WINDOW} gün`}
          icon={<IconChart size={24} color={violet} />}
        />

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
            {/* Besin grubu dağılımı — sayfanın kahramanı */}
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

            {/* Özet sayılar */}
            <View className="flex-row gap-3">
              <StatBox label="Kayıtlı gün" value={String(distinctDays)} />
              <StatBox label="Toplam kayıt" value={String(totalEntries)} />
              <StatBox label="Dokunulan grup" value={`${touched}/5`} />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
