import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated'
import { Circle, G, Path, Rect } from 'react-native-svg'
import { Layer, originAt, Sparkle, type AfiTone } from './parts'

/**
 * v2 pozlarının dekor parçaları (afiet-brand/maskot/afi-*.svg portu).
 *
 * Kurallar decor.tsx ile aynı: geometri marka dosyalarından birebir gelir,
 * hareket yalnız transform + opacity kullanır, reduceMotion açıkken parça
 * statik pozunda durur.
 *
 * Buhar kuralı: hiçbir dekor üçüncü bir tel gibi okunmamalıdır. Düşünme
 * noktaları bu yüzden kasenin SAĞ DIŞINDA, tellerden ayrı bir yayda durur.
 */

const MINT = '#a7f3d0'
const BRAND = '#059669'

/** Faz kaydırmalı bir dekor katmanı; parça kendi ekseninde oynar. */
function DecorLayer({
  cx,
  cy,
  size,
  style,
  children,
}: {
  cx: number
  cy: number
  size: number
  style: StyleProp<AnimatedStyle<ViewStyle>>
  children: React.ReactNode
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transformOrigin: originAt(cx, cy, size) }, style]}
    >
      <Layer>{children}</Layer>
    </Animated.View>
  )
}

/** Doğrusal saatten yumuşak salınım (motion.ts'teki wave ile aynı). */
function wave(p: number) {
  'worklet'
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * p)
}

/** Keyframe tablosundan değer okur. */
function at(p: number, t: number[], v: number[]) {
  'worklet'
  let i = 0
  while (i < t.length - 2 && p > t[i + 1]) i += 1
  const span = t[i + 1] - t[i]
  const f = span > 0 ? (p - t[i]) / span : 0
  return v[i] + (v[i + 1] - v[i]) * f
}

/* ---------- arama ---------- */

/** Mercek: mint aksanda kalır, yavaşça tarar. */
export function Magnifier({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  const k = size / 512
  const style = useAnimatedStyle(() => {
    const w = wave(decor.value)
    return {
      transform: [{ translateX: (-14 + 28 * w) * k }, { rotate: `${-7 + 14 * w}deg` }],
    }
  })
  const glass = (
    <G fill="none" stroke={MINT} strokeLinecap="round">
      <Circle cx={396} cy={176} r={52} strokeWidth={17} />
      <Path d="M433 213l40 40" strokeWidth={20} />
    </G>
  )
  if (reduced) return <Layer>{glass}</Layer>
  return (
    <DecorLayer cx={396} cy={176} size={size} style={style}>
      {glass}
    </DecorLayer>
  )
}

/* ---------- çevrimdışı ---------- */

/** Yumuşak bulut; tellerin soluna kalır, hafifçe süzülür. */
export function OfflineCloud({
  decor,
  reduced,
  size,
  tone,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
  tone: AfiTone
}) {
  const k = size / 512
  // Koyu zeminde krem bulut parlıyor; emerald'ın koyu ucuna çekilir.
  const fill = tone.contour ? '#ece4d4' : '#0d3a2d'
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (-9 + 18 * wave(decor.value)) * k }],
  }))
  const cloud = (
    <G fill={fill}>
      <Circle cx={86} cy={124} r={29} />
      <Circle cx={126} cy={100} r={39} />
      <Circle cx={164} cy={126} r={27} />
      <Rect x={86} y={124} width={78} height={29} rx={14.5} />
    </G>
  )
  if (reduced) return <Layer>{cloud}</Layer>
  return (
    <DecorLayer cx={126} cy={112} size={size} style={style}>
      {cloud}
    </DecorLayer>
  )
}

const ARCS = [
  { d: 'M404 250a30 30 0 0 1 42 0', base: 0.62, phase: 0 },
  { d: 'M386 222a56 56 0 0 1 78 0', base: 0.38, phase: 0.33 },
  { d: 'M368 194a82 82 0 0 1 114 0', base: 0.16, phase: 0.66 },
]

function SignalArc({
  decor,
  arc,
}: {
  decor: SharedValue<number>
  arc: (typeof ARCS)[number]
}) {
  const style = useAnimatedStyle(() => ({
    opacity: 0.14 + 0.48 * wave((decor.value + arc.phase) % 1),
  }))
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Layer>
        <Path d={arc.d} fill="none" stroke={MINT} strokeWidth={12} strokeLinecap="round" />
      </Layer>
    </Animated.View>
  )
}

/** Sinyal yayları: dıştaki söner, "ulaşamıyorum" der ama üzülmez. */
export function SignalArcs({ decor, reduced }: { decor: SharedValue<number>; reduced: boolean }) {
  if (reduced) {
    return (
      <Layer>
        {ARCS.map((a, i) => (
          <Path
            key={i}
            d={a.d}
            fill="none"
            stroke={MINT}
            strokeWidth={12}
            strokeLinecap="round"
            opacity={a.base}
          />
        ))}
      </Layer>
    )
  }
  return (
    <>
      {ARCS.map((a, i) => (
        <SignalArc key={i} decor={decor} arc={a} />
      ))}
    </>
  )
}

/* ---------- sıcaklık (afiyet selamı) ---------- */

/** Kalp marka yeşilinde; kırmızı kalp markanın dışındadır. */
const HEART =
  'M0 10C-10 0-22-8-22-20c0-10 8-16 15-16 4 0 7 3 7 6 0-3 3-6 7-6 7 0 15 6 15 16 0 12-12 20-22 30Z'

const HEARTS = [
  { x: 412, y: 254, s: 1.5, phase: 0 },
  { x: 462, y: 220, s: 1.05, phase: 0.35 },
  { x: 372, y: 206, s: 0.85, phase: 0.68 },
]

const RISE = { t: [0, 0.22, 0.72, 1], y: [8, -6, -52, -76], s: [0.55, 1, 0.95, 0.8], o: [0, 1, 0.7, 0] }

function FloatingHeart({
  decor,
  heart,
  size,
}: {
  decor: SharedValue<number>
  heart: (typeof HEARTS)[number]
  size: number
}) {
  const k = size / 512
  const style = useAnimatedStyle(() => {
    const p = (decor.value + heart.phase) % 1
    return {
      opacity: at(p, RISE.t, RISE.o),
      transform: [{ translateY: at(p, RISE.t, RISE.y) * k }, { scale: at(p, RISE.t, RISE.s) }],
    }
  })
  return (
    <DecorLayer cx={heart.x} cy={heart.y} size={size} style={style}>
      <Path d={HEART} fill={BRAND} transform={`translate(${heart.x} ${heart.y}) scale(${heart.s})`} />
    </DecorLayer>
  )
}

export function Hearts({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  if (reduced) {
    return (
      <Layer>
        {HEARTS.map((h, i) => (
          <Path
            key={i}
            d={HEART}
            fill={BRAND}
            opacity={1 - i * 0.25}
            transform={`translate(${h.x} ${h.y}) scale(${h.s})`}
          />
        ))}
      </Layer>
    )
  }
  return (
    <>
      {HEARTS.map((h, i) => (
        <FloatingHeart key={i} decor={decor} heart={h} size={size} />
      ))}
    </>
  )
}

/* ---------- Afi asistan: foto ---------- */

const CORNERS = [
  'M72 152V104a20 20 0 0 1 20-20h50',
  'M440 152V104a20 20 0 0 0-20-20h-50',
  'M72 400v48a20 20 0 0 0 20 20h50',
  'M440 400v48a20 20 0 0 0-20 20h-50',
]

/** Vizör köşeleri: nefes alır, "bakıyorum" der. */
export function Viewfinder({ decor, reduced }: { decor: SharedValue<number>; reduced: boolean }) {
  const style = useAnimatedStyle(() => ({ opacity: 0.5 + 0.5 * wave(decor.value) }))
  const corners = (
    <G fill="none" stroke={MINT} strokeWidth={15} strokeLinecap="round">
      {CORNERS.map((d, i) => (
        <Path key={i} d={d} />
      ))}
    </G>
  )
  if (reduced) return <Layer>{corners}</Layer>
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Layer>{corners}</Layer>
    </Animated.View>
  )
}

const SCAN = { t: [0, 0.12, 0.8, 1], y: [0, 0, 0, 366], o: [0, 0.45, 0.45, 0] }

/** Tarama çizgisi: çerçeve boyunca iner. */
export function ScanLine({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  const k = size / 512
  const bar = <Rect x={72} y={92} width={368} height={9} rx={4.5} fill={BRAND} opacity={0.45} />
  const style = useAnimatedStyle(() => {
    const p = decor.value
    // y ve o ayrı eğriler; ikisi de aynı duraklardan geçer
    const y = at(p, [0, 0.12, 1], [0, 0, 366])
    return { opacity: at(p, SCAN.t, SCAN.o), transform: [{ translateY: y * k }] }
  })
  if (reduced) {
    return (
      <Layer>
        <Rect x={72} y={242} width={368} height={9} rx={4.5} fill={BRAND} opacity={0.45} />
      </Layer>
    )
  }
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Layer>{bar}</Layer>
    </Animated.View>
  )
}

/* ---------- Afi asistan: düşünüyor ---------- */

/**
 * Düşünme noktaları. Kasenin SAĞ DIŞINDA, buhar tellerinden ayrı bir yayda
 * dururlar (teller viewBox'ta ~200-323 arasında); "buhar hep iki tel"
 * değişmezi hiçbir okumada zedelenmez.
 */
const DOTS = [
  { cx: 412, cy: 258, r: 10, phase: 0 },
  { cx: 444, cy: 220, r: 13, phase: 0.13 },
  { cx: 480, cy: 174, r: 17, phase: 0.26 },
]

const THINK = { t: [0, 0.28, 0.62, 1], s: [0.5, 1, 1, 0.6], o: [0, 1, 0.9, 0] }

function ThinkingDot({
  decor,
  dot,
  size,
}: {
  decor: SharedValue<number>
  dot: (typeof DOTS)[number]
  size: number
}) {
  const style = useAnimatedStyle(() => {
    const p = (decor.value + dot.phase) % 1
    return { opacity: at(p, THINK.t, THINK.o), transform: [{ scale: at(p, THINK.t, THINK.s) }] }
  })
  return (
    <DecorLayer cx={dot.cx} cy={dot.cy} size={size} style={style}>
      <Circle cx={dot.cx} cy={dot.cy} r={dot.r} fill={MINT} />
    </DecorLayer>
  )
}

export function ThinkingDots({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  if (reduced) {
    return (
      <Layer>
        {DOTS.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={MINT} opacity={1 - i * 0.18} />
        ))}
      </Layer>
    )
  }
  return (
    <>
      {DOTS.map((d, i) => (
        <ThinkingDot key={i} decor={decor} dot={d} size={size} />
      ))}
    </>
  )
}

/* ---------- Afi asistan: buldum ---------- */

const BADGE_IN = { t: [0, 0.2, 0.36, 0.46, 0.84, 1], s: [0.3, 0.3, 1.18, 1, 1, 0.95], o: [0, 0, 1, 1, 1, 0] }

/** Onay madalyonu: besin tanındı. */
export function CheckBadge({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  const badge = (
    <G>
      <Circle cx={400} cy={192} r={56} fill={BRAND} />
      <Circle cx={400} cy={192} r={56} fill="none" stroke={MINT} strokeWidth={8} />
      <Path
        d="M374 192l19 20 34-40"
        fill="none"
        stroke="#ffffff"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  )
  const style = useAnimatedStyle(() => {
    const p = decor.value
    return { opacity: at(p, BADGE_IN.t, BADGE_IN.o), transform: [{ scale: at(p, BADGE_IN.t, BADGE_IN.s) }] }
  })
  if (reduced) return <Layer>{badge}</Layer>
  return (
    <DecorLayer cx={400} cy={192} size={size} style={style}>
      {badge}
    </DecorLayer>
  )
}

/* ---------- oyunlaştırma: seviye ---------- */

const RING_OUT = { t: [0, 0.18, 0.34, 1], s: [0.55, 0.55, 1.1, 1.75], o: [0, 0, 0.9, 0] }

function LevelRing({
  decor,
  phase,
  rx,
  ry,
  width,
  size,
}: {
  decor: SharedValue<number>
  phase: number
  rx: number
  ry: number
  width: number
  size: number
}) {
  const style = useAnimatedStyle(() => {
    const p = (decor.value + phase) % 1
    return { opacity: at(p, RING_OUT.t, RING_OUT.o), transform: [{ scale: at(p, RING_OUT.t, RING_OUT.s) }] }
  })
  return (
    <DecorLayer cx={256} cy={430} size={size} style={style}>
      <G>
        <Path
          d={`M${256 - rx} 430a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0`}
          fill="none"
          stroke={MINT}
          strokeWidth={width}
        />
      </G>
    </DecorLayer>
  )
}

const LIFT = { t: [0, 0.22, 0.42, 0.68, 1], y: [18, 0, -22, -46, -46], o: [0, 1, 1, 0, 0] }

const SPEED = [
  { d: 'M80 272L104 172', w: 13, o: 1, phase: 0 },
  { d: 'M136 250L152 180', w: 10, o: 0.55, phase: 0.12 },
  { d: 'M432 272L408 172', w: 13, o: 1, phase: 0.06 },
  { d: 'M376 250L360 180', w: 10, o: 0.55, phase: 0.18 },
]

function SpeedLine({
  decor,
  line,
  size,
}: {
  decor: SharedValue<number>
  line: (typeof SPEED)[number]
  size: number
}) {
  const k = size / 512
  const style = useAnimatedStyle(() => {
    const p = (decor.value + line.phase) % 1
    return {
      opacity: at(p, LIFT.t, LIFT.o) * line.o,
      transform: [{ translateY: at(p, LIFT.t, LIFT.y) * k }],
    }
  })
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Layer>
        <Path d={line.d} fill="none" stroke={MINT} strokeWidth={line.w} strokeLinecap="round" />
      </Layer>
    </Animated.View>
  )
}

/**
 * Seviye sahnesi: zeminden halkalar açılır, iki yanda hız çizgileri yükselir.
 * Yol yalnız ileri gider; düşme sahnesi çizilmez.
 */
export function LevelBurst({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  if (reduced) {
    return (
      <Layer>
        <G fill="none" stroke={MINT} strokeLinecap="round">
          {SPEED.map((l, i) => (
            <Path key={i} d={l.d} strokeWidth={l.w} opacity={l.o} />
          ))}
        </G>
        <Sparkle x={256} y={56} r={6} a={14} />
      </Layer>
    )
  }
  return (
    <>
      <LevelRing decor={decor} phase={0} rx={112} ry={25} width={13} size={size} />
      <LevelRing decor={decor} phase={0.15} rx={146} ry={33} width={9} size={size} />
      {SPEED.map((l, i) => (
        <SpeedLine key={i} decor={decor} line={l} size={size} />
      ))}
      <Layer>
        <Sparkle x={256} y={56} r={6} a={14} />
      </Layer>
    </>
  )
}

/* ---------- oyunlaştırma: rozet ---------- */

/** Beş kollu yıldız; elle path yazmak yerine hesaplanır. */
function starPath(cx: number, cy: number, ro: number, ri: number, n = 5) {
  let d = ''
  for (let i = 0; i < n * 2; i += 1) {
    const r = i % 2 ? ri : ro
    const a = -Math.PI / 2 + (i * Math.PI) / n
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
  }
  return `${d}Z`
}

const POP_IN = {
  t: [0, 0.1, 0.3, 0.4, 0.88, 1],
  s: [0.2, 0.2, 1.16, 1, 1, 0.9],
  r: [-24, -24, 4, 0, 0, 0],
  o: [0, 0, 1, 1, 1, 0],
}

/** Unvan madalyonu: yaydan gelir, Afi sakin durur. */
export function StarBadge({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  const badge = (
    <G>
      <Circle cx={392} cy={182} r={58} fill={BRAND} />
      <Circle cx={392} cy={182} r={58} fill="none" stroke={MINT} strokeWidth={9} />
      <Path d={starPath(392, 184, 30, 14)} fill="#ffffff" />
    </G>
  )
  const style = useAnimatedStyle(() => {
    const p = decor.value
    return {
      opacity: at(p, POP_IN.t, POP_IN.o),
      transform: [{ scale: at(p, POP_IN.t, POP_IN.s) }, { rotate: `${at(p, POP_IN.t, POP_IN.r)}deg` }],
    }
  })
  return (
    <>
      {reduced ? (
        <Layer>{badge}</Layer>
      ) : (
        <DecorLayer cx={392} cy={182} size={size} style={style}>
          {badge}
        </DecorLayer>
      )}
      <Layer>
        <Sparkle x={452} y={108} r={5} a={12} opacity={0.9} />
        <Sparkle x={322} y={118} r={4} a={9} opacity={0.7} />
      </Layer>
    </>
  )
}

/* ---------- oyunlaştırma: ritim ---------- */

const RHYTHM_X = [148, 202, 256, 310, 364]
const FILL = { t: [0, 0.1, 0.16, 0.86, 1], s: [0.3, 1.25, 1, 1, 1], o: [0, 1, 1, 1, 0] }

function RhythmDot({
  decor,
  index,
  size,
}: {
  decor: SharedValue<number>
  index: number
  size: number
}) {
  const cx = RHYTHM_X[index]
  const style = useAnimatedStyle(() => {
    const p = (decor.value + index * 0.097) % 1
    return { opacity: at(p, FILL.t, FILL.o), transform: [{ scale: at(p, FILL.t, FILL.s) }] }
  })
  return (
    <DecorLayer cx={cx} cy={482} size={size} style={style}>
      <Circle cx={cx} cy={482} r={16} fill={BRAND} />
    </DecorLayer>
  )
}

/**
 * Haftalık ritim: beş afiyet günü sırayla dolar. Sayı değil doku anlatır,
 * eksik günler suçlanmaz.
 */
export function RhythmDots({
  decor,
  reduced,
  size,
  filled = 3,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
  /** Statik halde kaç noktanın dolu çizileceği. */
  filled?: number
}) {
  return (
    <>
      <Layer>
        {RHYTHM_X.map((cx, i) => (
          <Circle key={i} cx={cx} cy={482} r={16} fill="none" stroke={MINT} strokeWidth={7} />
        ))}
        {reduced &&
          RHYTHM_X.slice(0, filled).map((cx, i) => (
            <Circle key={`f${i}`} cx={cx} cy={482} r={16} fill={BRAND} />
          ))}
      </Layer>
      {!reduced && RHYTHM_X.map((_, i) => <RhythmDot key={i} decor={decor} index={i} size={size} />)}
    </>
  )
}
