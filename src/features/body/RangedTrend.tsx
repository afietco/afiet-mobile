import { useState } from 'react'
import { addDays, fromISO, todayISO } from '../../lib/dates'
import { WeightSparkline, type SparkPoint } from './WeightSparkline'

export const RANGE_OPTS = [
  { key: 'hafta', label: '1H', days: 7 },
  { key: 'ay', label: '1A', days: 30 },
  { key: 'yil', label: '1Y', days: 365 },
] as const

export type RangeKey = (typeof RANGE_OPTS)[number]['key'] | 'tum'

/** İlk kayıttan bugüne geçen gün sayısı */
export function calcSpanDays(points: SparkPoint[]): number {
  if (points.length === 0) return 0
  return Math.round(
    (fromISO(todayISO()).getTime() - fromISO(points[0].date).getTime()) / 86_400_000,
  )
}

/** Seçili aralığa göre nokta filtresi — 'tum' ya da henüz açılmamış aralıkta tümü */
export function filterByRange(points: SparkPoint[], range: RangeKey, spanDays: number): SparkPoint[] {
  const opt = RANGE_OPTS.find((o) => o.key === range && spanDays >= o.days)
  if (!opt) return points
  return points.filter((p) => p.date >= addDays(todayISO(), -opt.days))
}

interface RangeChipsProps {
  spanDays: number
  value: RangeKey
  onChange: (key: RangeKey) => void
}

/**
 * Zaman aralığı seçici — tüm gelişim grafiklerinin ortak parçası.
 * Varsayılan görünüm tüm zamanlar; 1H/1A/1Y seçenekleri ancak kayıt
 * geçmişi o aralığa ulaştığında görünür olur (o zamana dek chip yok).
 */
export function RangeChips({ spanDays, value, onChange }: RangeChipsProps) {
  const options = RANGE_OPTS.filter((o) => spanDays >= o.days)
  if (options.length === 0) return null
  const chips: { key: RangeKey; label: string }[] = [...options, { key: 'tum', label: 'Tümü' }]
  const activeKey = options.some((o) => o.key === value) ? value : 'tum'

  return (
    <div className="flex justify-end gap-1">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.key)}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
            c.key === activeKey ? 'bg-violet-600 text-white' : 'bg-muted text-soft'
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  )
}

interface RangedTrendProps {
  /** Tarihe göre artan tüm noktalar */
  points: SparkPoint[]
  height?: number
  className?: string
  label?: string
}

/** Kendi aralık durumunu tutan tekil grafik (ör. BMI sheet'i) */
export function RangedTrend({ points, height = 96, className, label }: RangedTrendProps) {
  const [range, setRange] = useState<RangeKey>('tum')
  const spanDays = calcSpanDays(points)
  const filtered = filterByRange(points, range, spanDays)

  return (
    <div>
      <div className="mb-2">
        <RangeChips spanDays={spanDays} value={range} onChange={setRange} />
      </div>
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-faint">Bu aralıkta ölçüm yok</p>
      ) : (
        <WeightSparkline points={filtered} height={height} showLabels className={className} label={label} />
      )}
    </div>
  )
}
