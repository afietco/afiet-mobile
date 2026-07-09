import { fromISO } from '../../lib/dates'
import { formatNumber } from './bodyMetrics'

export interface SparkPoint {
  date: string
  value: number
}

interface WeightSparklineProps {
  /** Tarihe göre artan sıralı noktalar */
  points: SparkPoint[]
  /** viewBox yüksekliği — genişlik 300 birim, ekranda orantılı ölçeklenir */
  height?: number
  showLabels?: boolean
  className?: string
}

const W = 300
const PAD = 10

/**
 * Elle çizilmiş kilo trend grafiği — bağımlılıksız SVG.
 * Renk `currentColor`: parent'tan `text-violet-500` vb. ile verilir.
 * X ekseni zamana orantılıdır (düzensiz kayıt aralıkları dürüst gösterilir).
 */
export function WeightSparkline({ points, height = 96, showLabels = false, className }: WeightSparklineProps) {
  if (points.length === 0) return null

  const H = height
  const labelPad = showLabels ? 12 : 0

  const times = points.map((p) => fromISO(p.date).getTime())
  const values = points.map((p) => p.value)
  const t0 = times[0]
  const tN = times[times.length - 1]
  const vMin = Math.min(...values)
  const vMax = Math.max(...values)
  const vPad = (vMax - vMin) * 0.08

  const x = (t: number) => (tN === t0 ? W / 2 : PAD + ((t - t0) / (tN - t0)) * (W - 2 * PAD))
  const y = (v: number) =>
    vMax === vMin
      ? H / 2
      : H - labelPad - PAD - ((v - (vMin - vPad)) / (vMax + vPad - (vMin - vPad))) * (H - 2 * PAD - 2 * labelPad)

  const coords = points.map((p, i) => ({ px: x(times[i]), py: y(p.value), value: p.value }))
  const last = coords[coords.length - 1]

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.px.toFixed(1)} ${c.py.toFixed(1)}`).join(' ')
  const area = `${line} L${last.px.toFixed(1)} ${H - 2} L${coords[0].px.toFixed(1)} ${H - 2} Z`

  const clampX = (px: number) => Math.min(Math.max(px, PAD + 14), W - PAD - 14)
  const minPt = coords[values.indexOf(vMin)]
  const maxPt = coords[values.indexOf(vMax)]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`h-auto w-full ${className ?? ''}`}
      role="img"
      aria-label="Kilo değişim grafiği"
    >
      {points.length > 1 && (
        <>
          <path d={area} fill="currentColor" opacity={0.12} stroke="none" />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      <circle cx={last.px} cy={last.py} r={3.5} fill="currentColor" />
      {showLabels && (
        <>
          {vMax !== vMin && (
            <>
              <text x={clampX(maxPt.px)} y={maxPt.py - 5} textAnchor="middle" className="fill-current text-[10px]" opacity={0.6}>
                {formatNumber(vMax)}
              </text>
              <text x={clampX(minPt.px)} y={minPt.py + 13} textAnchor="middle" className="fill-current text-[10px]" opacity={0.6}>
                {formatNumber(vMin)}
              </text>
            </>
          )}
          <text
            x={clampX(last.px)}
            y={last.py - 8}
            textAnchor="middle"
            className="fill-current text-[11px] font-bold"
          >
            {formatNumber(last.value)}
          </text>
        </>
      )}
    </svg>
  )
}
