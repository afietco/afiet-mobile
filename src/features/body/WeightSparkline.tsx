import { useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { fromISO } from '../../lib/dates'
import { formatNumber } from './bodyMetrics'

export interface SparkPoint {
  date: string
  value: number
}

/** Soluk arka plan şeridi olarak çizilen referans aralığı (ör. BMI denge bandı) */
export interface RefBand {
  from: number
  to: number
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
  /** Veri bandın yakınındaysa ölçek şeride kadar uzatılıp soluk fon olarak çizilir */
  refBand?: RefBand
}

const W = 300
const PAD = 10
const DAY_MS = 86_400_000
/** Çizgi 0,7 sn'de çizilir (ease-out); uç nokta çizgi kendisine ulaşırken belirir */
const END_DELAY_MS = 450

const dayMonth = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })
const monthShort = new Intl.DateTimeFormat('tr-TR', { month: 'short' })

/** Metin, çizginin üstünden geçse de okunsun diye kart zemini renginde hale */
const HALO = {
  paintOrder: 'stroke',
  stroke: 'var(--t-surface)',
  strokeWidth: 3.5,
  strokeLinejoin: 'round',
} as const

/**
 * Elle çizilmiş trend grafiği — bağımlılıksız SVG.
 * Renk `currentColor`: parent'tan `text-violet-500` vb. ile verilir.
 * X ekseni zamana orantılıdır (düzensiz kayıt aralıkları dürüst gösterilir).
 * Etiketli kullanımda noktaya dokununca tarih + değer gösterilir.
 */
export function WeightSparkline({
  points,
  height = 96,
  showLabels = false,
  className,
  label = 'Kilo değişim grafiği',
  refBand,
}: WeightSparklineProps) {
  const [sel, setSel] = useState<number | null>(null)
  // Aralık/ay değişince seçim bayatlar — sıfırla
  const pointsKey = points.map((p) => p.date).join()
  useEffect(() => setSel(null), [pointsKey])

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
  let lo = vMin - vPad
  let hi = vMax + vPad
  // Referans bandı verinin makul yakınındaysa ölçeği şeridin kenarına uzat —
  // uzaksa ölçeği ezmemek için görmezden gel
  if (refBand) {
    const span = Math.max(vMax - vMin, 1)
    if (refBand.to < vMin && vMin - refBand.to <= span * 1.5) lo = Math.min(lo, refBand.to - span * 0.1)
    if (refBand.from > vMax && refBand.from - vMax <= span * 1.5) hi = Math.max(hi, refBand.from + span * 0.1)
  }

  const x = (t: number) =>
    tN === t0 ? padL + (W - padL - padR) / 2 : padL + ((t - t0) / (tN - t0)) * (W - padL - padR)
  const y = (v: number) =>
    hi === lo ? padT + (H - padT - padB) / 2 : padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB)

  const coords = points.map((p, i) => ({ px: x(times[i]), py: y(p.value), value: p.value }))
  const last = coords[coords.length - 1]

  // Catmull-Rom → kübik bezier: köşesiz, akışkan çizgi.
  // Kontrol noktaları veri min/maks bandına kırpılır — eğri, gerçekte
  // olmayan bir değere taşıp kılavuz çizgilerin dışına sarkmasın diye.
  const yDataTop = y(vMax)
  const yDataBot = y(vMin)
  const clampY = (v: number) => Math.min(Math.max(v, yDataTop), yDataBot)
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

  // Y ekseni işaretleri: veri min/max (eşitse tek). Son değerle aynı olan
  // etiket yazılmaz — sağdaki uç nokta etiketiyle mükerrer görünmesin.
  const lastText = formatNumber(last.value)
  const ticks = (vMax === vMin ? [vMax] : [vMax, vMin]).map((v) => ({
    v,
    text: formatNumber(v),
  }))

  // Uzun aralıkta (2+ ay) ay başlarına ara işaret + kısa ay adı
  const monthTicks: { px: number; text: string; showText: boolean }[] = []
  if (showLabels && tN - t0 >= 60 * DAY_MS) {
    const d = fromISO(points[0].date)
    d.setDate(1)
    d.setMonth(d.getMonth() + 1)
    const all: { px: number; text: string }[] = []
    while (d.getTime() < tN) {
      all.push({ px: x(d.getTime()), text: monthShort.format(d) })
      d.setMonth(d.getMonth() + 1)
    }
    const step = all.length > 5 ? 2 : 1
    all.forEach((t, i) =>
      monthTicks.push({
        ...t,
        // Kenardaki ilk/son tarih etiketlerine çarpan ay adları yazılmaz
        showText: i % step === 0 && t.px > padL + 30 && t.px < W - padR - 30,
      }),
    )
  }

  // Referans bandının görünür kesiti ve kenar çizgileri
  const bandTop = refBand ? Math.min(hi, refBand.to) : 0
  const bandBot = refBand ? Math.max(lo, refBand.from) : 0
  const showBand = refBand != null && bandTop > bandBot
  const bandEdges = refBand ? [refBand.from, refBand.to].filter((v) => v > lo && v < hi) : []

  // Son değer etiketi: çizgi noktaya yukarıdan iniyorsa (ve altta yer varsa)
  // etiket alta alınır — çizginin yazının içinden geçmemesi için
  const prevPt = coords.length > 1 ? coords[coords.length - 2] : null
  const labelBelow = prevPt !== null && prevPt.py <= last.py && last.py + 16 <= H - padB
  const lastLabelY = labelBelow ? last.py + 15 : Math.max(last.py - 8, padT + 8)
  const endDelay = points.length > 1 ? END_DELAY_MS : 0

  // Dokun-gör: en yakın noktayı seç (sürükleyince kaydırılır, aynı noktaya
  // ikinci dokunuş kapatır). touch-action: pan-y — dikey sayfa kaydırması bozulmaz.
  const selIdx = sel !== null && sel < coords.length ? sel : null
  const nearestIdx = (e: ReactPointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const vx = ((e.clientX - rect.left) / rect.width) * W
    let best = 0
    for (let i = 1; i < coords.length; i++)
      if (Math.abs(coords[i].px - vx) < Math.abs(coords[best].px - vx)) best = i
    return best
  }
  const interactive = showLabels

  // Dokunulabilir ölçüm noktaları çizgi üstünde silik birer boncuk olarak
  // gösterilir (uç nokta hariç — onun kendi büyük noktası var). Noktalar
  // çok sıklaşınca gürültü olmasın diye gizlenirler. Sıfır uzunluklu path
  // segmentleri + yuvarlak uç: ekran ölçeğinden bağımsız sabit boyut.
  const markerSpacing = coords.length > 1 ? (W - padL - padR) / (coords.length - 1) : Infinity
  const markerPath =
    interactive && coords.length > 1 && markerSpacing >= 7
      ? coords
          .slice(0, -1)
          .map((c) => `M${c.px.toFixed(1)} ${c.py.toFixed(1)}h0.01`)
          .join(' ')
      : null

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`h-auto w-full ${className ?? ''}`}
      role="img"
      aria-label={label}
      style={interactive ? { touchAction: 'pan-y' } : undefined}
      onPointerDown={
        interactive
          ? (e) => {
              const i = nearestIdx(e)
              setSel((s) => (s === i ? null : i))
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (e) => {
              if (e.buttons > 0) setSel(nearestIdx(e))
            }
          : undefined
      }
    >
      {showBand && (
        <rect
          x={padL}
          y={y(bandTop)}
          width={W - padL - padR}
          height={Math.max(y(bandBot) - y(bandTop), 0)}
          rx={2}
          className="fill-emerald-500"
          opacity={0.08}
        />
      )}
      {bandEdges.map((v) => (
        <line
          key={`b${v}`}
          x1={padL}
          x2={W - padR}
          y1={y(v)}
          y2={y(v)}
          className="stroke-emerald-500"
          strokeWidth={1}
          strokeDasharray="4 3"
          opacity={0.35}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {showLabels &&
        ticks.map((t) => (
          <g key={t.v}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t.v)}
              y2={y(t.v)}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.15}
              vectorEffect="non-scaling-stroke"
            />
            {t.text !== lastText && (
              <text x={padL - 5} y={y(t.v) + 3} textAnchor="end" className="fill-current text-[9px]" opacity={0.55}>
                {t.text}
              </text>
            )}
          </g>
        ))}
      {showLabels &&
        bandEdges
          .filter((v) => ticks.every((t) => Math.abs(y(v) - y(t.v)) >= 9))
          .map((v) => (
            <text
              key={`bl${v}`}
              x={padL - 5}
              y={y(v) + 3}
              textAnchor="end"
              className="fill-emerald-600 text-[9px] dark:fill-emerald-400"
              opacity={0.9}
            >
              {formatNumber(v)}
            </text>
          ))}

      {monthTicks.map((m) => (
        <g key={m.px}>
          <line
            x1={m.px}
            x2={m.px}
            y1={padT}
            y2={H - padB}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.08}
            vectorEffect="non-scaling-stroke"
          />
          {m.showText && (
            <text x={m.px} y={H - 3} textAnchor="middle" className="fill-current text-[9px]" opacity={0.45}>
              {m.text}
            </text>
          )}
        </g>
      ))}

      {points.length > 1 && (
        /* Çizgi + nokta boncukları soldan sağa maskeyle açılarak girer */
        <g key={`l${line}`} className="animate-draw-line">
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {markerPath && (
            <path
              d={markerPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={5.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.45}
            />
          )}
        </g>
      )}
      <circle
        key={`c${last.px}-${last.py}`}
        cx={last.px}
        cy={last.py}
        r={3.5}
        fill="currentColor"
        className="animate-pop-in origin-center [transform-box:fill-box]"
        style={{ animationDelay: `${endDelay}ms` }}
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
          {selIdx === null && (
            <text
              key={`t${last.px}-${last.py}`}
              x={clampX(last.px)}
              y={lastLabelY}
              textAnchor="middle"
              className="animate-pop-in origin-center [transform-box:fill-box] fill-current text-[11px] font-bold"
              style={{ animationDelay: `${endDelay}ms` }}
              {...HALO}
            >
              {lastText}
            </text>
          )}
        </>
      )}

      {selIdx !== null && (
        <g>
          <line
            x1={coords[selIdx].px}
            x2={coords[selIdx].px}
            y1={padT}
            y2={H - padB}
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="2 3"
            opacity={0.35}
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={coords[selIdx].px}
            cy={coords[selIdx].py}
            r={4}
            fill="var(--t-surface)"
            stroke="currentColor"
            strokeWidth={2.5}
          />
          <text
            x={Math.min(Math.max(coords[selIdx].px, padL + 34), W - padR - 34)}
            y={coords[selIdx].py - 10 >= padT + 6 ? coords[selIdx].py - 10 : coords[selIdx].py + 18}
            textAnchor="middle"
            className="fill-current text-[11px] font-bold"
            {...HALO}
          >
            {formatNumber(points[selIdx].value)}
            <tspan className="text-[9px] font-semibold" opacity={0.75} dx={4}>
              {dayMonth.format(fromISO(points[selIdx].date))}
            </tspan>
          </text>
        </g>
      )}
    </svg>
  )
}
