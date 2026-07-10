import { formatNumber, fromISO } from '@afiet/core'
import { useEffect, useState, type ComponentProps } from 'react'
import { View, type GestureResponderEvent } from 'react-native'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
  TSpan,
} from 'react-native-svg'
import { tokens, useTheme } from '@/theme/useTheme'

/* Web WeightSparkline.tsx portu — geometri matematiği birebir; farklar:
   currentColor yerine `color` prop'u, getBoundingClientRect yerine
   onLayout + locationX, draw-in web'de CSS maskesiyle — burada reanimated'lı
   ClipPath dikdörtgeni soldan sağa açılır.
   Dokun-gör grafiğin üstünde dikey kaydırmayı yutar — grafik alçak, kabul. */

const AnimatedRect = Animated.createAnimatedComponent(Rect)

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
  /** Çizgi rengi (web'de currentColor'dı) */
  color: string
  /** Erişilebilirlik etiketi */
  label?: string
  /** Veri bandın yakınındaysa ölçek şeride kadar uzatılıp soluk fon olarak çizilir */
  refBand?: RefBand
}

const W = 300
const PAD = 10
const DAY_MS = 86_400_000
const BAND_GREEN = '#10b981'

const dayMonth = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })
const monthShort = new Intl.DateTimeFormat('tr-TR', { month: 'short' })

/** Metin, çizginin üstünden geçse de okunsun diye zemin renginde hale —
    react-native-svg'de paintOrder yok: önce konturlu kopya, üstüne dolgu */
function HaloText({
  halo,
  children,
  ...props
}: ComponentProps<typeof SvgText> & { halo: string }) {
  return (
    <>
      <SvgText {...props} stroke={halo} strokeWidth={3.5} strokeLinejoin="round">
        {children}
      </SvgText>
      <SvgText {...props}>{children}</SvgText>
    </>
  )
}

/**
 * Elle çizilmiş trend grafiği — bağımlılıksız SVG.
 * X ekseni zamana orantılıdır (düzensiz kayıt aralıkları dürüst gösterilir).
 * Etiketli kullanımda noktaya dokununca tarih + değer gösterilir.
 */
export function WeightSparkline({
  points,
  height = 96,
  showLabels = false,
  color,
  label = 'Kilo değişim grafiği',
  refBand,
}: WeightSparklineProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [sel, setSel] = useState<number | null>(null)
  const [viewW, setViewW] = useState(0)
  // Aralık/ay değişince seçim bayatlar — sıfırla
  const pointsKey = points.map((p) => p.date).join()
  useEffect(() => setSel(null), [pointsKey])

  // Çizgi soldan sağa 0,7 sn'de çizilir (web animate-draw-line karşılığı).
  // Başlangıç değeri W: animasyon bir nedenle çalışmazsa grafik yine görünür.
  const reveal = useSharedValue(W)
  useEffect(() => {
    reveal.value = 0
    reveal.value = withTiming(W, { duration: 700, easing: Easing.out(Easing.cubic) })
  }, [pointsKey, reveal])
  const clipProps = useAnimatedProps(() => ({ width: reveal.value }))

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

  const x = (tt: number) =>
    tN === t0 ? padL + (W - padL - padR) / 2 : padL + ((tt - t0) / (tN - t0)) * (W - padL - padR)
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
    all.forEach((tick, i) =>
      monthTicks.push({
        ...tick,
        // Kenardaki ilk/son tarih etiketlerine çarpan ay adları yazılmaz
        showText: i % step === 0 && tick.px > padL + 30 && tick.px < W - padR - 30,
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

  // Dokun-gör: en yakın noktayı seç (sürükleyince kaydırılır, aynı noktaya
  // ikinci dokunuş kapatır)
  const selIdx = sel !== null && sel < coords.length ? sel : null
  const nearestIdx = (e: GestureResponderEvent) => {
    if (viewW === 0) return 0
    const vx = (e.nativeEvent.locationX / viewW) * W
    let best = 0
    for (let i = 1; i < coords.length; i++)
      if (Math.abs(coords[i].px - vx) < Math.abs(coords[best].px - vx)) best = i
    return best
  }
  const interactive = showLabels

  // Dokunulabilir ölçüm noktaları çizgi üstünde silik birer boncuk olarak
  // gösterilir (uç nokta hariç — onun kendi büyük noktası var). Noktalar
  // çok sıklaşınca gürültü olmasın diye gizlenirler.
  const markerSpacing = coords.length > 1 ? (W - padL - padR) / (coords.length - 1) : Infinity
  const markerPath =
    interactive && coords.length > 1 && markerSpacing >= 7
      ? coords
          .slice(0, -1)
          .map((c) => `M${c.px.toFixed(1)} ${c.py.toFixed(1)}h0.01`)
          .join(' ')
      : null

  return (
    <View onLayout={(e) => setViewW(e.nativeEvent.layout.width)}>
      <Svg
        width="100%"
        style={{ aspectRatio: W / H }}
        viewBox={`0 0 ${W} ${H}`}
        accessibilityLabel={label}
        onStartShouldSetResponder={() => interactive}
        onResponderGrant={(e) => {
          const i = nearestIdx(e)
          setSel((s) => (s === i ? null : i))
        }}
        onResponderMove={(e) => setSel(nearestIdx(e))}
      >
        <Defs>
          <ClipPath id="reveal">
            <AnimatedRect x={0} y={0} height={1000} animatedProps={clipProps} />
          </ClipPath>
        </Defs>
        {showBand && (
          <Rect
            x={padL}
            y={y(bandTop)}
            width={W - padL - padR}
            height={Math.max(y(bandBot) - y(bandTop), 0)}
            rx={2}
            fill={BAND_GREEN}
            opacity={0.08}
          />
        )}
        {bandEdges.map((v) => (
          <Line
            key={`b${v}`}
            x1={padL}
            x2={W - padR}
            y1={y(v)}
            y2={y(v)}
            stroke={BAND_GREEN}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.35}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {showLabels &&
          ticks.map((tick) => (
            <G key={`t${tick.v}`}>
              <Line
                x1={padL}
                x2={W - padR}
                y1={y(tick.v)}
                y2={y(tick.v)}
                stroke={color}
                strokeWidth={1}
                strokeDasharray="3 4"
                opacity={0.15}
                vectorEffect="non-scaling-stroke"
              />
              {tick.text !== lastText && (
                <SvgText
                  x={padL - 5}
                  y={y(tick.v) + 3}
                  textAnchor="end"
                  fontSize={9}
                  fill={color}
                  opacity={0.55}
                >
                  {tick.text}
                </SvgText>
              )}
            </G>
          ))}
        {showLabels &&
          bandEdges
            .filter((v) => ticks.every((tick) => Math.abs(y(v) - y(tick.v)) >= 9))
            .map((v) => (
              <SvgText
                key={`bl${v}`}
                x={padL - 5}
                y={y(v) + 3}
                textAnchor="end"
                fontSize={9}
                fill={isDark ? '#34d399' : '#059669'}
                opacity={0.9}
              >
                {formatNumber(v)}
              </SvgText>
            ))}

        {monthTicks.map((m) => (
          <G key={`m${m.px}`}>
            <Line
              x1={m.px}
              x2={m.px}
              y1={padT}
              y2={H - padB}
              stroke={color}
              strokeWidth={1}
              opacity={0.08}
              vectorEffect="non-scaling-stroke"
            />
            {m.showText && (
              <SvgText x={m.px} y={H - 3} textAnchor="middle" fontSize={9} fill={color} opacity={0.45}>
                {m.text}
              </SvgText>
            )}
          </G>
        ))}

        <G clipPath="url(#reveal)">
          {points.length > 1 && (
            <>
              <Path
                d={line}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {markerPath && (
                <Path
                  d={markerPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.45}
                />
              )}
            </>
          )}
          <Circle cx={last.px} cy={last.py} r={3.5} fill={color} />
        </G>

        {showLabels && (
          <>
            <SvgText
              x={points.length > 1 ? padL : W / 2}
              y={H - 3}
              textAnchor={points.length > 1 ? 'start' : 'middle'}
              fontSize={9}
              fill={color}
              opacity={0.55}
            >
              {dayMonth.format(fromISO(points[0].date))}
            </SvgText>
            {points.length > 1 && (
              <SvgText x={W - padR} y={H - 3} textAnchor="end" fontSize={9} fill={color} opacity={0.55}>
                {dayMonth.format(fromISO(points[points.length - 1].date))}
              </SvgText>
            )}
            {selIdx === null && (
              <HaloText
                halo={t.surface}
                x={clampX(last.px)}
                y={lastLabelY}
                textAnchor="middle"
                fontSize={11}
                fontFamily="Nunito_700Bold"
                fill={color}
              >
                {lastText}
              </HaloText>
            )}
          </>
        )}

        {selIdx !== null && (
          <>
            <Line
              x1={coords[selIdx].px}
              x2={coords[selIdx].px}
              y1={padT}
              y2={H - padB}
              stroke={color}
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.35}
              vectorEffect="non-scaling-stroke"
            />
            <Circle
              cx={coords[selIdx].px}
              cy={coords[selIdx].py}
              r={4}
              fill={t.surface}
              stroke={color}
              strokeWidth={2.5}
            />
            <HaloText
              halo={t.surface}
              x={Math.min(Math.max(coords[selIdx].px, padL + 34), W - padR - 34)}
              y={coords[selIdx].py - 10 >= padT + 6 ? coords[selIdx].py - 10 : coords[selIdx].py + 18}
              textAnchor="middle"
              fontSize={11}
              fontFamily="Nunito_700Bold"
              fill={color}
            >
              {formatNumber(points[selIdx].value)}
              <TSpan fontSize={9} fontFamily="Nunito_600SemiBold" fillOpacity={0.75} dx={4}>
                {dayMonth.format(fromISO(points[selIdx].date))}
              </TSpan>
            </HaloText>
          </>
        )}
      </Svg>
    </View>
  )
}
