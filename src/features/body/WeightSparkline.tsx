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
  /** Eksenler: solda min/max değerleri + kılavuz çizgileri, altta tarih aralığı */
  showLabels?: boolean
  className?: string
  /** Erişilebilirlik etiketi */
  label?: string
}

const W = 300
const PAD = 10

const dayMonth = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })

/**
 * Elle çizilmiş trend grafiği — bağımlılıksız SVG.
 * Renk `currentColor`: parent'tan `text-violet-500` vb. ile verilir.
 * X ekseni zamana orantılıdır (düzensiz kayıt aralıkları dürüst gösterilir).
 */
export function WeightSparkline({
  points,
  height = 96,
  showLabels = false,
  className,
  label = 'Kilo değişim grafiği',
}: WeightSparklineProps) {
  if (points.length === 0) return null

  const H = height
  const padL = showLabels ? 34 : PAD
  const padR = PAD
  const padT = showLabels ? 12 : PAD
  const padB = showLabels ? 15 : PAD

  const times = points.map((p) => fromISO(p.date).getTime())
  const values = points.map((p) => p.value)
  const t0 = times[0]
  const tN = times[times.length - 1]
  const vMin = Math.min(...values)
  const vMax = Math.max(...values)
  const vPad = (vMax - vMin) * 0.08
  const lo = vMin - vPad
  const hi = vMax + vPad

  const x = (t: number) =>
    tN === t0 ? padL + (W - padL - padR) / 2 : padL + ((t - t0) / (tN - t0)) * (W - padL - padR)
  const y = (v: number) =>
    hi === lo ? padT + (H - padT - padB) / 2 : padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB)

  const coords = points.map((p, i) => ({ px: x(times[i]), py: y(p.value), value: p.value }))
  const last = coords[coords.length - 1]

  // Catmull-Rom → kübik bezier: köşesiz, akışkan çizgi
  const clampY = (v: number) => Math.min(Math.max(v, padT), H - padB)
  let line = `M${coords[0].px.toFixed(1)} ${coords[0].py.toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[i + 2] ?? p2
    const c1x = p1.px + (p2.px - p0.px) / 6
    const c1y = clampY(p1.py + (p2.py - p0.py) / 6)
    const c2x = p2.px - (p3.px - p1.px) / 6
    const c2y = clampY(p2.py - (p3.py - p1.py) / 6)
    line += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.px.toFixed(1)} ${p2.py.toFixed(1)}`
  }

  const clampX = (px: number) => Math.min(Math.max(px, padL + 14), W - padR - 14)
  // Y ekseni işaretleri: veri min/max (eşitse tek)
  const ticks = vMax === vMin ? [vMax] : [vMax, vMin]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`h-auto w-full ${className ?? ''}`}
      role="img"
      aria-label={label}
    >
      {showLabels &&
        ticks.map((v) => (
          <g key={v}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(v)}
              y2={y(v)}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.15}
              vectorEffect="non-scaling-stroke"
            />
            <text x={padL - 5} y={y(v) + 3} textAnchor="end" className="fill-current text-[9px]" opacity={0.55}>
              {formatNumber(v)}
            </text>
          </g>
        ))}

      {points.length > 1 && (
        /* pathLength=1: çizgi soldan sağa çizilerek girer (animate-draw-line) */
        <path
          key={`l${line}`}
          d={line}
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="animate-draw-line"
        />
      )}
      <circle
        key={`c${last.px}-${last.py}`}
        cx={last.px}
        cy={last.py}
        r={3.5}
        fill="currentColor"
        className="animate-pop-in origin-center [transform-box:fill-box]"
      />

      {showLabels && (
        <>
          <text
            x={points.length > 1 ? padL : W / 2}
            y={H - 3}
            textAnchor={points.length > 1 ? 'start' : 'middle'}
            className="fill-current text-[9px]"
            opacity={0.55}
          >
            {dayMonth.format(fromISO(points[0].date))}
          </text>
          {points.length > 1 && (
            <text x={W - padR} y={H - 3} textAnchor="end" className="fill-current text-[9px]" opacity={0.55}>
              {dayMonth.format(fromISO(points[points.length - 1].date))}
            </text>
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
