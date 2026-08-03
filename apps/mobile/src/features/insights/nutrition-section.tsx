/**
 * "Besin değerleri": the last thirty days as a shape rather than as a score.
 *
 * Four readings, in the order somebody actually asks them: how is my energy
 * moving, how is it split, when am I balanced, and where are the gaps. Every
 * one of them is expressed as a share, an average or a pattern; none of them
 * is a distance from a target, because thirty days of "you reached 70%" reads
 * as thirty small failures however kindly it is worded (BRAND.md: a calorie is
 * information, never a limit).
 */
import { addDays, energyTrend, summarizeNutritionWindow, todayISO } from '@afiet/core'
import { ScrollView, View } from 'react-native'
import { mealRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { BalanceCalendar } from './BalanceCalendar'
import { EnergyTrend } from './EnergyTrend'
import { GroupMealMatrix } from './GroupMealMatrix'
import { MacroShareBand } from './MacroShareBand'
import { useNutritionRange } from './useNutritionRange'

const WINDOW = 30

function StatBox({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-surface p-4">
      <View className="flex-row items-baseline gap-1">
        <AppText weight="extrabold" className="text-2xl text-ink">
          {value}
        </AppText>
        {unit ? <AppText className="text-xs text-faint">{unit}</AppText> : null}
      </View>
      <AppText className="mt-0.5 text-xs text-soft">{label}</AppText>
    </View>
  )
}

const oneDecimal = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

export function NutritionSection() {
  const { id: profileId } = useActiveProfile()
  const today = todayISO()
  const from = addDays(today, -(WINDOW - 1))

  const rangeQuery = useNutritionRange(from, today)
  const days = rangeQuery.data?.days

  /* The matrix reads the raw records instead of the range endpoint: which
     group landed at which meal is in the entries themselves, so it needs no
     server arithmetic. */
  const entriesQuery = useLive(
    ['meals'],
    () => (profileId ? mealRepo.forRange(profileId, from, today) : Promise.resolve([])),
    [profileId, from, today],
  )
  const entries = entriesQuery.data

  if (!profileId || days === undefined || entries === undefined)
    return (
      <PageSkeleton
        error={rangeQuery.error ?? entriesQuery.error}
        onRetry={() => {
          rangeQuery.retry()
          entriesQuery.retry()
        }}
      />
    )

  const window = summarizeNutritionWindow(days)
  const trend = energyTrend(days)
  const loggedCount = window.loggedDays.length

  if (loggedCount === 0) {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View className="items-center rounded-2xl bg-surface p-5">
          <AfiPose pose="merak" size={88} />
          <AppText className="mt-2 text-center text-sm text-soft">
            Son {WINDOW} günde kayıt yok. Besin ekledikçe enerji akışın, makro
            dağılımın ve denge takvimin burada belirir 🌱
          </AppText>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      <View className="gap-3">
        <EnergyTrend points={trend} averageKcal={window.averageKcal} />
        <MacroShareBand shares={window.shares} />

        <View className="flex-row gap-3">
          <StatBox
            label="Günlük denge"
            value={
              window.averageBalance === null ? '-' : oneDecimal.format(window.averageBalance)
            }
            unit="/5 grup"
          />
          <StatBox
            label="Günlük su"
            value={
              window.averageWaterGlasses === null
                ? '-'
                : oneDecimal.format(window.averageWaterGlasses)
            }
            unit="bardak"
          />
          <StatBox label="Kayıtlı gün" value={`${loggedCount}/${WINDOW}`} />
        </View>

        <BalanceCalendar days={days} />
        <GroupMealMatrix entries={entries} />

        {/* Sayıların ne kadarına güvenilebileceğini söylemek, sayıları
            göstermenin bir parçası: katalogda tanınmayan bir kayıt enerjiye
            hiç girmiyor ve bu sessizce olursa toplam olduğundan küçük görünür. */}
        {window.unknownCount > 0 ? (
          <View className="rounded-2xl bg-surface p-4">
            <AppText className="text-xs leading-5 text-faint">
              Bu dönemdeki {window.knownCount + window.unknownCount} kaydın{' '}
              {window.unknownCount} tanesinin besin değeri bilinmiyor, o yüzden
              yukarıdaki sayılara girmedi. Menüm'de o besinlere değer eklersen
              tablo tamamlanır.
            </AppText>
          </View>
        ) : null}
      </View>
    </ScrollView>
  )
}
