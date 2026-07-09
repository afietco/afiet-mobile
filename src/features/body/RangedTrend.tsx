import { useState } from 'react'
import { addDays, fromISO, todayISO } from '../../lib/dates'
import { WeightSparkline, type SparkPoint } from './WeightSparkline'

const RANGE_OPTS = [
  { key: 'hafta', label: '1H', days: 7 },
  { key: 'ay', label: '1A', days: 30 },
  { key: 'yil', label: '1Y', days: 365 },
] as const

type RangeKey = (typeof RANGE_OPTS)[number]['key'] | 'tum'

interface RangedTrendProps {
  /** Tarihe göre artan tüm noktalar */
  points: SparkPoint[]
  height?: number
  className?: string
  label?: string
}

/**
 * Zaman aralıklı trend grafiği — tüm gelişim grafiklerinin ortak parçası.
 * Varsayılan görünüm tüm zamanlar; 1H/1A/1Y seçenekleri ancak kayıt
 * geçmişi o aralığa ulaştığında görünür olur.
 */
export function RangedTrend({ points, height = 96, className, label }: RangedTrendProps) {
  const [range, setRange] = useState<RangeKey>('tum')
  const today = todayISO()

  const spanDays = points.length
    ? Math.round((fromISO(today).getTime() - fromISO(points[0].date).getTime()) / 86_400_000)
    : 0
  const options = RANGE_OPTS.filter((o) => spanDays >= o.days)
  const activeDays = options.find((o) => o.key === range)?.days ?? null
  const filtered = activeDays === null ? points : points.filter((p) => p.date >= addDays(today, -activeDays))

  const chips: { key: RangeKey; label: string }[] =
    options.length > 0 ? [...options, { key: 'tum' as const, label: 'Tümü' }] : []

  return (
    <div>
      {chips.length > 0 && (
        <div className="mb-2 flex justify-end gap-1">
          {chips.map((c) => {
            const active = c.key === range || (c.key === 'tum' && activeDays === null)
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setRange(c.key)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  active ? 'bg-violet-600 text-white' : 'bg-muted text-soft'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-faint">Bu aralıkta ölçüm yok</p>
      ) : (
        <WeightSparkline points={filtered} height={height} showLabels className={className} label={label} />
      )}
    </div>
  )
}
