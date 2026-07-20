import { fromISO, todayISO } from '@afiet/core'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { WeightSparkline, type RefBand, type SparkPoint } from './WeightSparkline'

/* Web RangedTrend.tsx portu; aralık mantığı birebir */

/** Aylık görünümde monthOffset: 0 = bu ay, 1 = geçen ay... */
export interface TrendRange {
  mode: 'ay' | 'tum'
  monthOffset: number
}

export const DEFAULT_RANGE: TrendRange = { mode: 'tum', monthOffset: 0 }

/** İlk kayıttan bugüne geçen gün sayısı */
export function calcSpanDays(points: SparkPoint[]): number {
  if (points.length === 0) return 0
  return Math.round(
    (fromISO(todayISO()).getTime() - fromISO(points[0].date).getTime()) / 86_400_000,
  )
}

function monthDate(offset: number): Date {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - offset)
  return d
}

/** İlk kaydın ayı ile bu ay arasındaki ay sayısı; geriye gezinme sınırı */
export function maxMonthOffset(points: SparkPoint[]): number {
  if (points.length === 0) return 0
  const [fy, fm] = points[0].date.split('-').map(Number)
  const now = new Date()
  return (now.getFullYear() - fy) * 12 + (now.getMonth() + 1 - fm)
}

export function filterByRange(points: SparkPoint[], range: TrendRange): SparkPoint[] {
  if (range.mode === 'tum') return points
  const d = monthDate(range.monthOffset)
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  return points.filter((p) => p.date.startsWith(key))
}

interface RangeChipsProps {
  spanDays: number
  value: TrendRange
  onChange: (range: TrendRange) => void
}

/**
 * Zaman aralığı seçici; tüm gelişim grafiklerinin ortak parçası.
 * Ay seçeneği kayıt geçmişi bir aya ulaştığında görünür olur.
 */
export function RangeChips({ spanDays, value, onChange }: RangeChipsProps) {
  if (spanDays < 30) return null
  const chips = [
    { key: 'ay' as const, label: 'Ay' },
    { key: 'tum' as const, label: 'Tümü' },
  ]
  return (
    <View className="flex-row justify-end gap-1">
      {chips.map((c) => (
        <Pressable
          key={c.key}
          accessibilityRole="button"
          onPress={() => onChange({ mode: c.key, monthOffset: 0 })}
          className={`rounded-full px-2.5 py-1 ${
            c.key === value.mode ? 'bg-violet-600' : 'bg-muted'
          }`}
        >
          <AppText
            weight="semibold"
            className={`text-xs ${c.key === value.mode ? 'text-white' : 'text-soft'}`}
          >
            {c.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  )
}

const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' })

interface MonthNavProps {
  value: TrendRange
  maxOffset: number
  onChange: (range: TrendRange) => void
}

/** Aylık görünümde önceki/sonraki ay gezintisi */
export function MonthNav({ value, maxOffset, onChange }: MonthNavProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  if (value.mode !== 'ay') return null
  const prevDisabled = value.monthOffset >= maxOffset
  const nextDisabled = value.monthOffset <= 0
  return (
    <View className="mb-1 flex-row items-center justify-center gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Önceki ay"
        disabled={prevDisabled}
        onPress={() => onChange({ ...value, monthOffset: value.monthOffset + 1 })}
        className={`h-7 w-7 items-center justify-center rounded-full bg-muted ${
          prevDisabled ? 'opacity-30' : ''
        }`}
      >
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <IconChevronRight size={16} color={t.soft} />
        </View>
      </Pressable>
      <AppText weight="semibold" className="min-w-32 text-center text-sm text-ink">
        {monthFmt.format(monthDate(value.monthOffset))}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sonraki ay"
        disabled={nextDisabled}
        onPress={() => onChange({ ...value, monthOffset: value.monthOffset - 1 })}
        className={`h-7 w-7 items-center justify-center rounded-full bg-muted ${
          nextDisabled ? 'opacity-30' : ''
        }`}
      >
        <IconChevronRight size={16} color={t.soft} />
      </Pressable>
    </View>
  )
}

interface RangedTrendProps {
  /** Tarihe göre artan tüm noktalar */
  points: SparkPoint[]
  height?: number
  color: string
  label?: string
  refBand?: RefBand
}

/** Kendi aralık durumunu tutan tekil grafik (ör. BMI sheet'i) */
export function RangedTrend({ points, height = 96, color, label, refBand }: RangedTrendProps) {
  const [range, setRange] = useState<TrendRange>(DEFAULT_RANGE)
  const filtered = filterByRange(points, range)

  return (
    <View>
      <View className="mb-2">
        <RangeChips spanDays={calcSpanDays(points)} value={range} onChange={setRange} />
      </View>
      <MonthNav value={range} maxOffset={maxMonthOffset(points)} onChange={setRange} />
      {filtered.length === 0 ? (
        <AppText className="py-6 text-center text-sm text-faint">Bu ayda ölçüm yok</AppText>
      ) : (
        <WeightSparkline
          points={filtered}
          height={height}
          showLabels
          color={color}
          label={label}
          refBand={refBand}
        />
      )}
    </View>
  )
}
