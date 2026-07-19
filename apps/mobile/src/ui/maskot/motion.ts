import { useEffect } from 'react'
import {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

/**
 * Afi maskotunun hareket dili (afiet-brand/maskot/afi-maskot.html bölüm 03 +
 * 06'daki Reanimated eşleme tablosunun portu).
 *
 * Kurallar:
 *  - Yalnızca transform + opacity, yani UI thread'de 60 fps, Lottie yok.
 *  - Animasyonlar DEKORATİFTİR: reduceMotion açıkken hiç başlatılmaz ve
 *    figür statik pozda kalır (maskot/README.md erişilebilirlik notu).
 *
 * Kurgu: her hareketli parça kendi katmanında (bkz. parts.tsx) durur ve
 * doğrusal bir "saatten" beslenir. Salınımlar kosinüs dalgasıyla (CSS
 * ease-in-out 0/50/100 karşılığı), çok adımlı hareketler keyframe tablosuyla
 * çözülür.
 */

export type AfiMotion =
  | 'yok'
  | 'idle'
  | 'selam'
  | 'zipla'
  | 'yukleniyor'
  | 'peek'
  | 'uyku'
  | 'gunaydin'
  | 'heyecan'
  | 'zafer'
  | 'aile'
  | 'pop'

/** Keyframe'lerdeki px değerleri markanın galerisinde 170px figüre göre yazıldı. */
const REF = 170

interface Clocks {
  /** Ana figür saati (ms). 0 ise figür durur. */
  fig: number
  /** Buhar telleri (ms). */
  wisp: number
  /** Uzun telin faz kayması (0..1). */
  wispPhase: number
  /** İkincil parça: kase salınımı ya da aile pozunda yavru figür (ms). */
  aux: number
  /** Dekor saati: konfeti, kabarcık, yıldız (ms). */
  decor: number
}

const CLOCKS: Record<AfiMotion, Clocks> = {
  yok: { fig: 0, wisp: 0, wispPhase: 0, aux: 0, decor: 0 },
  idle: { fig: 3200, wisp: 1600, wispPhase: 0.5, aux: 0, decor: 0 },
  selam: { fig: 0, wisp: 1500, wispPhase: 0, aux: 3000, decor: 0 },
  zipla: { fig: 2600, wisp: 1300, wispPhase: 0.5, aux: 0, decor: 2600 },
  yukleniyor: { fig: 0, wisp: 1300, wispPhase: 0.5, aux: 2600, decor: 0 },
  peek: { fig: 5000, wisp: 1600, wispPhase: 0.5, aux: 0, decor: 5000 },
  uyku: { fig: 5200, wisp: 1600, wispPhase: 0.5, aux: 0, decor: 2600 },
  gunaydin: { fig: 4000, wisp: 4000, wispPhase: 0.0375, aux: 0, decor: 0 },
  heyecan: { fig: 2600, wisp: 550, wispPhase: 0.5, aux: 340, decor: 900 },
  zafer: { fig: 3200, wisp: 1300, wispPhase: 0.5, aux: 0, decor: 2600 },
  aile: { fig: 3200, wisp: 1600, wispPhase: 0.5, aux: 1600, decor: 0 },
  pop: { fig: 450, wisp: 1600, wispPhase: 0.5, aux: 0, decor: 0 },
}

/* Keyframe tabloları: t = duraklar (0..1), diğerleri o duraklardaki değerler. */

/** Zıplama: çömel, havalan, in. */
const JUMP = {
  t: [0, 0.08, 0.14, 0.3, 0.46, 0.54, 1],
  y: [0, 0, 2, -34, 0, 0, 0],
  sx: [1, 1, 1.06, 0.97, 1.03, 1, 1],
  sy: [1, 1, 0.9, 1.06, 0.95, 1, 1],
}
/** Zıplarken gölge daralır. */
const SQUASH = { t: [0, 0.08, 0.3, 0.46, 1], sx: [1, 1, 0.72, 1, 1] }

/** Zafer: çift hop. */
const HOP2 = {
  t: [0, 0.06, 0.1, 0.2, 0.3, 0.34, 0.44, 0.54, 1],
  y: [0, 0, 2, -26, 0, 1, -16, 0, 0],
  sx: [1, 1, 1.05, 0.98, 1.02, 1.04, 0.99, 1, 1],
  sy: [1, 1, 0.92, 1.04, 0.96, 0.94, 1.02, 1, 1],
}
const SQUASH2 = { t: [0, 0.06, 0.2, 0.3, 0.44, 0.54, 1], sx: [1, 1, 0.74, 1, 0.84, 1, 1] }

/** Yükleniyor: teller yükselip söner. */
const RISE = { t: [0, 0.3, 1], y: [8, -1.6, -24], sy: [0.86, 0.944, 1.14], o: [0, 1, 0] }

/** Günaydın: figür yerleşir, buhar açılır. */
const WAKEUP = { t: [0, 0.12, 0.3, 0.42, 1], y: [10, 10, -6, 0, 0], s: [0.98, 0.98, 1.01, 1, 1] }
const BLOOM = {
  t: [0, 0.18, 0.4, 0.62, 0.92, 1],
  y: [6, 6, -3, -8, 6, 6],
  sy: [0.25, 0.25, 1.08, 1, 0.25, 0.25],
  o: [0, 0, 1, 0.95, 0, 0],
}

/** Aile: yavru kase hoplar. */
const MINIHOP = { t: [0, 0.22, 0.32, 0.46, 0.6, 1], y: [0, 0, 2, -15, 0, 0], sy: [1, 1, 0.93, 1.05, 1, 1] }

/** Peek: kenardan süzülüp geri çekilir. */
const PEEK = { t: [0, 0.22, 0.6, 0.82, 1], x: [-112, -18, -18, -112, -112] }

/** Pop: tek atışlık onay. */
const POP = { t: [0, 0.5, 1], s: [1, 1.12, 1] }

function kf(p: number, stops: number[], values: number[]) {
  'worklet'
  return interpolate(p, stops, values, Extrapolation.CLAMP)
}

/** Doğrusal saatten yumuşak salınım: CSS ease-in-out 0/50/100 karşılığı. */
function wave(p: number) {
  'worklet'
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * p)
}

/**
 * Tek bir buhar telinin stili. İki tel aynı saatten beslenir, uzun tel
 * `offset` kadar faz kaymasıyla gecikir.
 */
function wispStyle(motion: AfiMotion, raw: number, offset: number, k: number, isLong: boolean) {
  'worklet'
  const p = (raw + offset) % 1
  let ty = 0
  let sy = 1
  let rot = 0
  let o = 1
  let breathe = false
  switch (motion) {
    case 'yukleniyor':
      ty = kf(p, RISE.t, RISE.y)
      sy = kf(p, RISE.t, RISE.sy)
      o = kf(p, RISE.t, RISE.o)
      break
    case 'gunaydin':
      ty = kf(p, BLOOM.t, BLOOM.y)
      sy = kf(p, BLOOM.t, BLOOM.sy)
      o = kf(p, BLOOM.t, BLOOM.o)
      break
    case 'selam':
      // uzun tel el sallar (-4° → 26°), kısa tel normal nefesini sürdürür
      if (isLong) rot = -4 + 30 * wave(p)
      else breathe = true
      break
    case 'yok':
      break
    default:
      breathe = true
  }
  if (breathe) {
    const w = wave(p)
    ty = -3 - 7 * w
    sy = 1 + 0.06 * w
    o = 0.62 + 0.38 * w
  }
  return {
    opacity: o,
    transform: [{ rotate: `${rot}deg` }, { translateY: ty * k }, { scaleY: sy }],
  }
}

/**
 * Bir maskot örneği için hareket stilleri.
 * @param motion hareket adı
 * @param size figürün kenar uzunluğu (px); keyframe px'leri buna ölçeklenir
 */
export function useAfiMotion(motion: AfiMotion, size: number) {
  const reduced = useReducedMotion()
  const fig = useSharedValue(0)
  const wisp = useSharedValue(0)
  const aux = useSharedValue(0)
  const decor = useSharedValue(0)

  /** Galeri px'inden bu örneğin px'ine ölçek. */
  const k = size / REF
  const phase = CLOCKS[motion].wispPhase

  useEffect(() => {
    const c = CLOCKS[motion]
    const spin = (v: SharedValue<number>, ms: number) => {
      v.value = 0
      if (reduced || ms === 0) return
      v.value = withRepeat(withTiming(1, { duration: ms, easing: Easing.linear }), -1)
    }

    if (motion === 'pop') {
      // Tek atış: döngüye girmez, 0.45 sn'de bir kez oynayıp dinlenir.
      fig.value = 0
      if (!reduced) fig.value = withTiming(1, { duration: c.fig, easing: Easing.linear })
    } else {
      spin(fig, c.fig)
    }
    spin(wisp, c.wisp)
    spin(aux, c.aux)
    spin(decor, c.decor)
  }, [motion, reduced, fig, wisp, aux, decor])

  const figure = useAnimatedStyle(() => {
    const p = fig.value
    let tx = 0
    let ty = 0
    let sx = 1
    let sy = 1
    switch (motion) {
      case 'idle':
      case 'uyku':
      case 'heyecan':
      case 'aile':
        // süzülme: 0 → -10 → 0
        ty = -10 * wave(p)
        break
      case 'zipla':
        ty = kf(p, JUMP.t, JUMP.y)
        sx = kf(p, JUMP.t, JUMP.sx)
        sy = kf(p, JUMP.t, JUMP.sy)
        break
      case 'zafer':
        ty = kf(p, HOP2.t, HOP2.y)
        sx = kf(p, HOP2.t, HOP2.sx)
        sy = kf(p, HOP2.t, HOP2.sy)
        break
      case 'gunaydin':
        ty = kf(p, WAKEUP.t, WAKEUP.y)
        sx = kf(p, WAKEUP.t, WAKEUP.s)
        sy = sx
        break
      case 'pop':
        sx = kf(p, POP.t, POP.s)
        sy = sx
        break
      case 'peek':
        tx = kf(p, PEEK.t, PEEK.x)
        break
    }
    return {
      transform: [{ translateX: tx * k }, { translateY: ty * k }, { scaleX: sx }, { scaleY: sy }],
    }
  })

  const shortWisp = useAnimatedStyle(() => wispStyle(motion, wisp.value, 0, k, false))
  const longWisp = useAnimatedStyle(() => wispStyle(motion, wisp.value, phase, k, true))

  /** Kase salınımı; aile pozunda yavru figürü sürer. */
  const auxStyle = useAnimatedStyle(() => {
    const p = aux.value
    let ty = 0
    let sx = 1
    let sy = 1
    let rot = 0
    switch (motion) {
      case 'selam':
        // kase yaslanır: 0 → -5°
        rot = -5 * wave(p)
        break
      case 'yukleniyor':
        // nefes: 1 → 1.02
        sx = 1 + 0.02 * wave(p)
        sy = sx
        break
      case 'heyecan': {
        // fokurdama: ±1.2°
        const w = wave(p)
        rot = -1.2 + 2.4 * w
        ty = -2 * w
        break
      }
      case 'aile':
        ty = kf(p, MINIHOP.t, MINIHOP.y)
        sy = kf(p, MINIHOP.t, MINIHOP.sy)
        break
    }
    return {
      transform: [
        { rotate: `${rot}deg` },
        { translateY: ty * k },
        { scaleX: sx },
        { scaleY: sy },
      ],
    }
  })

  /** Gölge yalnızca zıplama ve zaferde daralır. */
  const shadow = useAnimatedStyle(() => {
    const p = fig.value
    let sx = 1
    if (motion === 'zipla') sx = kf(p, SQUASH.t, SQUASH.sx)
    else if (motion === 'zafer') sx = kf(p, SQUASH2.t, SQUASH2.sx)
    return { transform: [{ scaleX: sx }] }
  })

  return { figure, shortWisp, longWisp, aux: auxStyle, shadow, decor, reduced }
}

export type AfiMotionStyles = ReturnType<typeof useAfiMotion>
