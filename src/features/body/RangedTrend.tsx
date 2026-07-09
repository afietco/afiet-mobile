import { useState } from 'react'
import { fromISO, todayISO } from '../../lib/dates'
import { IconChevronRight } from '../../ui/icons'
import { WeightSparkline, type RefBand, type SparkPoint } from './WeightSparkline'

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

/** İlk kaydın ayı ile bu ay arasındaki ay sayısı — geriye gezinme sınırı */
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
 * Zaman aralığı seçici — tüm gelişim grafiklerinin ortak parçası.
 * Varsayılan tüm zamanlar; Ay seçeneği kayıt geçmişi bir aya
 * ulaştığında görünür olur (o zamana dek chip yok).
 */
export function RangeChips({ spanDays, value, onChange }: RangeChipsProps) {
  if (spanDays < 30) return null
  const chips = [
    { key: 'ay' as const, label: 'Ay' },
    { key: 'tum' as const, label: 'Tümü' },
  ]
  return (
    <div className="flex justify-end gap-1">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange({ mode: c.key, monthOffset: 0 })}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            c.key === value.mode ? 'bg-violet-600 text-white' : 'bg-muted text-soft'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
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
  if (value.mode !== 'ay') return null
  const navBtn =
    'flex h-7 w-7 items-center justify-center rounded-full bg-muted text-soft active:scale-95 disabled:opacity-30'
  return (
    <div className="animate-slide-fade-in mb-1 flex items-center justify-center gap-3">
      <button
        type="button"
        aria-label="Önceki ay"
        disabled={value.monthOffset >= maxOffset}
        onClick={() => onChange({ ...value, monthOffset: value.monthOffset + 1 })}
        className={navBtn}
      >
        <IconChevronRight className="h-4 w-4 rotate-180" />
      </button>
      <span className="min-w-32 text-center text-sm font-semibold">
        {monthFmt.format(monthDate(value.monthOffset))}
      </span>
      <button
        type="button"
        aria-label="Sonraki ay"
        disabled={value.monthOffset <= 0}
        onClick={() => onChange({ ...value, monthOffset: value.monthOffset - 1 })}
        className={navBtn}
      >
        <IconChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

interface RangedTrendProps {
  /** Tarihe göre artan tüm noktalar */
  points: SparkPoint[]
  height?: number
  className?: string
  label?: string
  refBand?: RefBand
}

/** Kendi aralık durumunu tutan tekil grafik (ör. BMI sheet'i) */
export function RangedTrend({ points, height = 96, className, label, refBand }: RangedTrendProps) {
  const [range, setRange] = useState<TrendRange>(DEFAULT_RANGE)
  const filtered = filterByRange(points, range)

  return (
    <div>
      <div className="mb-2">
        <RangeChips spanDays={calcSpanDays(points)} value={range} onChange={setRange} />
      </div>
      <MonthNav value={range} maxOffset={maxMonthOffset(points)} onChange={setRange} />
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-faint">Bu ayda ölçüm yok</p>
      ) : (
        <WeightSparkline points={filtered} height={height} showLabels className={className} label={label} refBand={refBand} />
      )}
    </div>
  )
}
