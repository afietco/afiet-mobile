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
import { View } from 'react-native'
import { AppText } from '@/ui/AppText'
import { breakdownLines, type MonthBreakdownRow } from './monthBreakdown'

export function MonthBreakdownCard({
  rows,
  total,
}: {
  rows: MonthBreakdownRow[]
  total: number
}) {
  const visible = breakdownLines(rows)
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
          <View key={row.key} className="flex-row items-baseline gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-sm text-ink">{row.label}</AppText>
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
