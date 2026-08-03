/**
 * Where this month's points actually came from.
 *
 * The dictionary says what things are worth; this says what YOU did, which is
 * the half that makes the ladder feel like it belongs to somebody. Same shape
 * as the kese breakdown on purpose: the two economies are explained the same
 * way, so learning one teaches the other.
 *
 * Zero rows are dropped rather than shown at nought. A list of noughts reads
 * as a report card, and this screen never grades anybody.
 */
import type { XpSource } from '@afiet/core'
import { View } from 'react-native'
import { AppText } from '@/ui/AppText'

export interface MonthBreakdownRow {
  source: XpSource
  /** Total points from this source this month. */
  amount: number
  /** How many times it happened; shown when it reads as a count. */
  count: number
}

const LABELS: Record<XpSource, string> = {
  afiyet_day: 'Afiyet günlerin',
  afiyet_week: 'Afiyet haftaların',
  meal_entry: 'Öğün kayıtların',
  water_goal: 'Su hedefin',
  measurement: 'Ölçümlerin',
  greeting: 'Karşılıklı selamların',
  rainbow_week: 'Beş grubu gördüğün haftalar',
  milestone: 'Tamamladığın görevler',
}

export function MonthBreakdownCard({
  rows,
  total,
}: {
  rows: MonthBreakdownRow[]
  total: number
}) {
  const visible = rows.filter((row) => row.amount > 0).sort((a, b) => b.amount - a.amount)
  if (visible.length === 0) return null

  return (
    <View className="mt-3 rounded-2xl bg-surface p-4">
      <View className="mb-3 flex-row items-baseline justify-between">
        <AppText weight="bold" className="text-sm text-ink">
          Bu ayki puanın
        </AppText>
        <AppText weight="extrabold" className="text-base text-ink">
          {total}
        </AppText>
      </View>

      <View className="gap-2.5">
        {visible.map((row) => (
          <View key={row.source} className="flex-row items-baseline gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-sm text-ink">{LABELS[row.source]}</AppText>
              {row.count > 0 ? (
                <AppText className="text-xs text-faint">{row.count} kez</AppText>
              ) : null}
            </View>
            <AppText weight="bold" className="text-sm text-emerald-700 dark:text-emerald-300">
              +{row.amount}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  )
}
