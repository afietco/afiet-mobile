import {
  formatNumber,
  formatShortTR,
  fromISO,
  relativeDayLabel,
  type Measurement,
} from '@afiet/core'
import { Pressable, View } from 'react-native'
import { measurementRepo } from '../../data/repositories'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconX } from '@/ui/icons'

/* Web MeasurementHistory.tsx portu — tarihe göre azalan liste (sheet içeriği) */

const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short' })

function GirthChip({ label, value }: { label: string; value: number }) {
  return (
    <View className="rounded-full bg-surface px-2 py-0.5">
      <AppText weight="semibold" className="text-[11px] text-soft">
        {label} {formatNumber(value)}
      </AppText>
    </View>
  )
}

export function MeasurementHistory({ measurements }: { measurements: Measurement[] }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  if (measurements.length === 0)
    return <AppText className="py-4 text-center text-sm text-faint">Henüz ölçüm yok</AppText>
  const desc = [...measurements].reverse()

  return (
    <View className="gap-2">
      {desc.map((m, i) => {
        const older = desc[i + 1]
        const diff = older ? m.weightKg - older.weightKg : null
        const d = fromISO(m.date)
        const hasGirths = m.waistCm != null || m.neckCm != null || m.hipCm != null
        return (
          <View key={m.id} className="flex-row items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <View className="h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface">
              <AppText weight="extrabold" className="text-sm text-ink">
                {dayFmt.format(d)}
              </AppText>
              <AppText className="text-[10px] text-faint">{monthFmt.format(d)}</AppText>
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row flex-wrap items-baseline gap-x-1.5">
                <AppText weight="extrabold" className="text-ink">
                  {formatNumber(m.weightKg)}{' '}
                  <AppText weight="semibold" className="text-xs text-soft">
                    kg
                  </AppText>
                </AppText>
                {diff !== null && Math.abs(diff) >= 0.05 && (
                  <AppText weight="semibold" className="text-xs text-soft">
                    {diff < 0 ? '↓' : '↑'} {formatNumber(Math.abs(diff))}
                  </AppText>
                )}
                {relativeDayLabel(m.date) && (
                  <AppText className="text-xs text-faint">{relativeDayLabel(m.date)}</AppText>
                )}
              </View>
              {hasGirths && (
                <View className="mt-1 flex-row flex-wrap gap-1">
                  {m.waistCm != null && <GirthChip label="Bel" value={m.waistCm} />}
                  {m.neckCm != null && <GirthChip label="Boyun" value={m.neckCm} />}
                  {m.hipCm != null && <GirthChip label="Kalça" value={m.hipCm} />}
                </View>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${formatShortTR(m.date)} ölçümünü sil`}
              onPress={() => void measurementRepo.remove(m.id!)}
              className="shrink-0 rounded-full px-2 py-1"
            >
              <IconX size={16} color={t.faint} />
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}
