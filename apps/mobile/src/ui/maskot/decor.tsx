import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg'
import { Layer, originAt, Sparkle } from './parts'

/**
 * Pozlara özgü dekor parçaları (kaşık, bardak, ay, uyku şapkası, konfeti).
 * Hepsi maskot/afi-*.svg dosyalarından birebir alındı; kabarcıklar hariç
 * (onlar galerinin "heyecan" sahnesine ait, poz dosyasında yok).
 *
 * Bölüm aksanları korunur: su pozunda bardak sky kalır, yeşile boyanmaz.
 */

const REF = 170
const MINT = '#a7f3d0'

/* ---------- statik dekorlar ---------- */

/** Tahta kaşık, kaseye yaslanır (tahıl/amber tonu). */
export function Spoon() {
  const at = 'translate(134 270) rotate(24)'
  return (
    <Layer>
      <Ellipse cx={0} cy={-30} rx={25} ry={33} transform={at} fill="#f59e0b" />
      <Ellipse cx={0} cy={-32} rx={15} ry={22} transform={at} fill="#022c22" opacity={0.16} />
      <Rect x={-8} y={0} width={16} height={160} rx={8} transform={at} fill="#f59e0b" />
    </Layer>
  )
}

/** Su bardağı + damla. */
export function Glass() {
  const cup = 'M412 296h68l-8 106a13 13 0 0 1-13 12h-26a13 13 0 0 1-13-12z'
  return (
    <Layer>
      <G transform="rotate(-5 446 360)">
        <Path d={cup} fill="#0ea5e9" opacity={0.14} />
        <Path
          d="M417 342h58l-5 60a13 13 0 0 1-13 12h-22a13 13 0 0 1-13-12z"
          fill="#0ea5e9"
          opacity={0.38}
        />
        <Path d={cup} fill="none" stroke="#0ea5e9" strokeWidth={8} strokeLinejoin="round" />
      </G>
      <Path d="M446 234c9 13 15 19 15 28a15 15 0 1 1-30 0c0-9 6-15 15-28z" fill="#0ea5e9" />
    </Layer>
  )
}

/** Gece göğü: ay (yıldızlar ayrı, parıldayabilsin diye). */
export function Moon() {
  return (
    <Layer>
      <Path d="M132 92a44 44 0 1 0 52 62 36 36 0 1 1-52-62z" fill={MINT} opacity={0.9} />
    </Layer>
  )
}

/** Uyku şapkası: kasenin üstüne düşer, ponponu beyaz. */
export function SleepCap() {
  return (
    <Layer>
      <Path
        d="M310 262C330 214 400 200 452 250C430 274 398 286 370 288C342 290 322 278 310 262Z"
        fill={MINT}
      />
      <Path
        d="M314 264C338 280 372 286 424 266"
        fill="none"
        stroke="#ffffff"
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Circle cx={454} cy={250} r={14} fill="#ffffff" stroke={MINT} strokeWidth={5} />
    </Layer>
  )
}

/* ---------- parıldayan yıldızlar (uyku) ---------- */

const STARS = [
  { x: 92, y: 208, r: 5, a: 12, opacity: 0.85, phase: 0 },
  { x: 186, y: 52, r: 4, a: 10, opacity: 0.7, phase: 0.5 },
  { x: 436, y: 128, r: 4, a: 10, opacity: 0.7, phase: 0.5 },
]

function TwinklingStar({
  decor,
  phase,
  star,
}: {
  decor: SharedValue<number>
  phase: number
  star: (typeof STARS)[number]
}) {
  const style = useAnimatedStyle(() => {
    const p = (decor.value + phase) % 1
    return { opacity: 0.3 + 0.65 * (0.5 - 0.5 * Math.cos(2 * Math.PI * p)) }
  })
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Layer>
        <Sparkle x={star.x} y={star.y} r={star.r} a={star.a} />
      </Layer>
    </Animated.View>
  )
}

export function Stars({ decor, reduced }: { decor: SharedValue<number>; reduced: boolean }) {
  if (reduced) {
    return (
      <Layer>
        {STARS.map((s, i) => (
          <Sparkle key={i} x={s.x} y={s.y} r={s.r} a={s.a} opacity={s.opacity} />
        ))}
      </Layer>
    )
  }
  return (
    <>
      {STARS.map((s, i) => (
        <TwinklingStar key={i} decor={decor} phase={s.phase} star={s} />
      ))}
    </>
  )
}

/* ---------- konfeti (kutlama) ---------- */

/**
 * Konfeti 5 besin grubu renginde: sebze/emerald, meyve/rose, protein/orange,
 * tahıl/amber, süt/sky. Kutlama bile besin dengesini anlatır.
 *
 * NOT: galerideki "zafer" yağmuru (430 px düşüş) burada UYGULANMAZ; maskot
 * kendi kutusunun içinde kalır, tam ekran yağmuru ui/Confetti.tsx taşır.
 */
const CONFETTI: { cx: number; cy: number; node: ReactNode }[] = [
  { cx: 118, cy: 148, node: <Circle cx={118} cy={148} r={9} fill="#f43f5e" /> },
  { cx: 396, cy: 118, node: <Circle cx={396} cy={118} r={8} fill="#0ea5e9" /> },
  { cx: 76, cy: 256, node: <Circle cx={76} cy={256} r={7} fill="#f59e0b" /> },
  { cx: 436, cy: 238, node: <Circle cx={436} cy={238} r={8} fill="#f97316" /> },
  { cx: 152, cy: 82, node: <Circle cx={152} cy={82} r={7} fill="#059669" /> },
  {
    cx: 354,
    cy: 76,
    node: <Rect x={344} y={72} width={20} height={9} rx={4.5} fill="#f43f5e" transform="rotate(28 354 76)" />,
  },
  {
    cx: 62,
    cy: 182,
    node: <Rect x={52} y={178} width={20} height={9} rx={4.5} fill="#0ea5e9" transform="rotate(-22 62 182)" />,
  },
  {
    cx: 451,
    cy: 168,
    node: <Rect x={442} y={164} width={18} height={8} rx={4} fill="#f59e0b" transform="rotate(46 451 168)" />,
  },
  {
    cx: 103,
    cy: 346,
    node: <Rect x={94} y={342} width={18} height={8} rx={4} fill="#f97316" transform="rotate(18 103 346)" />,
  },
  {
    cx: 421,
    cy: 334,
    node: <Rect x={412} y={330} width={18} height={8} rx={4} fill="#059669" transform="rotate(-30 421 334)" />,
  },
  { cx: 256, cy: 58, node: <Sparkle x={256} y={44} r={6} a={14} /> },
  { cx: 430, cy: 88, node: <Sparkle x={430} y={78} r={4} a={10} /> },
  { cx: 70, cy: 118, node: <Sparkle x={70} y={108} r={4} a={10} /> },
]

/** Parçaların faz kayması: hepsi aynı anda patlamasın. */
const CONFETTI_PHASE = [0, 0.12, 0.24, 0.06, 0.18, 0.3, 0.09, 0.21, 0.15, 0.27, 0.03, 0.33, 0.36]

const CF = {
  t: [0, 0.26, 0.38, 0.72, 1],
  y: [14, 14, -8, 26, 44],
  s: [0.4, 0.4, 1.1, 1, 0.9],
  r: [0, 0, 24, 60, 80],
  o: [0, 0, 1, 0.9, 0],
}

function ConfettiPiece({
  decor,
  phase,
  piece,
  size,
}: {
  decor: SharedValue<number>
  phase: number
  piece: (typeof CONFETTI)[number]
  size: number
}) {
  const k = size / REF
  const style = useAnimatedStyle(() => {
    const p = (decor.value + phase) % 1
    let i = 0
    while (i < CF.t.length - 2 && p > CF.t[i + 1]) i += 1
    const span = CF.t[i + 1] - CF.t[i]
    const f = span > 0 ? (p - CF.t[i]) / span : 0
    const at = (v: number[]) => v[i] + (v[i + 1] - v[i]) * f
    return {
      opacity: at(CF.o),
      transform: [
        { translateY: at(CF.y) * k },
        { scale: at(CF.s) },
        { rotate: `${at(CF.r)}deg` },
      ],
    }
  })
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { transformOrigin: originAt(piece.cx, piece.cy, size) },
        style,
      ]}
    >
      <Layer>{piece.node}</Layer>
    </Animated.View>
  )
}

export function ConfettiBurst({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  if (reduced) {
    return <Layer>{CONFETTI.map((c, i) => <G key={i}>{c.node}</G>)}</Layer>
  }
  return (
    <>
      {CONFETTI.map((piece, i) => (
        <ConfettiPiece key={i} decor={decor} phase={CONFETTI_PHASE[i]} piece={piece} size={size} />
      ))}
    </>
  )
}

/* ---------- kabarcıklar (heyecan) ---------- */

/** Kaseden yükselen kabarcıklar. Poz dosyasında yok, galerinin sahnesinden. */
const BUBBLES = [
  { cx: 228, cy: 258, r: 7, phase: 0 },
  { cx: 258, cy: 248, r: 5, phase: 0.33 },
  { cx: 286, cy: 260, r: 6, phase: 0.66 },
]

const BUB = { t: [0, 0.35, 1], y: [3, -6, -24], s: [0.3, 0.75, 1], o: [0, 1, 0] }

function Bubble({
  decor,
  bubble,
  size,
}: {
  decor: SharedValue<number>
  bubble: (typeof BUBBLES)[number]
  size: number
}) {
  const k = size / REF
  const style = useAnimatedStyle(() => {
    const p = (decor.value + bubble.phase) % 1
    const i = p > BUB.t[1] ? 1 : 0
    const span = BUB.t[i + 1] - BUB.t[i]
    const f = (p - BUB.t[i]) / span
    const at = (v: number[]) => v[i] + (v[i + 1] - v[i]) * f
    return {
      opacity: at(BUB.o),
      transform: [{ translateY: at(BUB.y) * k }, { scale: at(BUB.s) }],
    }
  })
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { transformOrigin: originAt(bubble.cx, bubble.cy, size) },
        style,
      ]}
    >
      <Layer>
        <Circle cx={bubble.cx} cy={bubble.cy} r={bubble.r} fill={MINT} />
      </Layer>
    </Animated.View>
  )
}

export function Bubbles({
  decor,
  reduced,
  size,
}: {
  decor: SharedValue<number>
  reduced: boolean
  size: number
}) {
  if (reduced) return null
  return (
    <>
      {BUBBLES.map((b, i) => (
        <Bubble key={i} decor={decor} bubble={b} size={size} />
      ))}
    </>
  )
}
