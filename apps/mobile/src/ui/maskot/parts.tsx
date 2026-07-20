import type { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import Svg, { Ellipse, G, Path, Rect } from 'react-native-svg'

/**
 * Afi maskotunun ortak geometrisi (afiet-brand/maskot/*.svg portu).
 *
 * Maskot LOGODAN ayrıdır: logo tile üstünde yaşar (ui/Afi.tsx), maskot
 * tile'sız serbest durur ve zemin gölgesiyle ekranın içine iner.
 *
 * Marka değişmezleri (maskot/README.md), dokunma:
 *  - Yüz hiç değişmez: kapalı mutlu gözler + minik gülümseme, hep #047857.
 *  - Buhar HEP iki tel, asla üç.
 *  - Üzgün ya da kızgın Afi yapılmaz; hata pozunda (oops) bile yüz aynıdır,
 *    şefkati duruş ve mikro kopya taşır.
 *
 * Parçalar ayrı katmanlar halinde çizilir: her biri aynı 512'lik viewBox'ı
 * paylaşıp üst üste biner, böylece hareket eden parça kendi Animated.View'unda
 * bağımsız oynar (bkz. motion.ts).
 */

/** Poz dosyalarındaki yol verisi, birebir. */
const SHORT_WISP = 'M207 232c0-19 17-23 17-42s-17-21-17-40'
const LONG_WISP = 'M300 238c0-21 19-25 19-48s-19-23-19-46'
/** Mini pozda buhar tek bükümdür (32 px altında ikinci büküm okunmuyor). */
const SHORT_WISP_MINI = 'M207 232c0-19 17-23 17-42'
const LONG_WISP_MINI = 'M300 238c0-21 19-25 19-48'
const BOWL = 'M116 276h280a140 108 0 0 1-280 0z'
const EYE_LEFT = 'M180 316q23-21 46 0'
const EYE_RIGHT = 'M286 316q23-21 46 0'
const SMILE = 'M238 342q18 14 36 0'

/** Her pozda figürü saran 1.07'lik ölçek grubu. */
export const FIG = 'translate(256 288) scale(1.07) translate(-256 -288)'

/** Kısa tel her zeminde mint kalır; yüz her zeminde brand-deep. */
const MINT = '#a7f3d0'
const FACE = '#047857'

export interface AfiTone {
  /** Uzun buhar teli: açık zeminde marka yeşili, koyu zeminde beyaz. */
  longWisp: string
  /** Kase ve ayak konturu; koyu zeminde kontur yoktur. */
  contour?: string
  /** Zemin gölgesinin opaklığı. */
  shadow: number
}

export const TONES: Record<'light' | 'dark', AfiTone> = {
  light: { longWisp: '#059669', contour: '#ece4d4', shadow: 0.08 },
  dark: { longWisp: '#ffffff', shadow: 0.35 },
}

/**
 * Çizgi kalınlıkları. Küçülen figürde çizgi kalınlaşır ki anatomi okunur
 * kalsın: yavru kase (aile pozu) ve mini poz kendi ölçeğini taşır.
 */
export interface AfiWeight {
  /** Kısa ve uzun buhar teli. */
  wisp: [number, number]
  /** Sol göz, sağ göz, gülümseme. */
  face: [number, number, number]
  /** Kase ve ayak konturu. */
  edge: number
  /** Ayak dikdörtgeni. */
  foot: { x: number; y: number; w: number; h: number; rx: number }
}

const FOOT = { x: 210, y: 394, w: 92, h: 20, rx: 10 }

export const WEIGHTS: Record<'normal' | 'yavru' | 'mini', AfiWeight> = {
  normal: { wisp: [21, 23], face: [15, 15, 13], edge: 4, foot: FOOT },
  yavru: { wisp: [24, 26], face: [17, 17, 15], edge: 4, foot: FOOT },
  mini: { wisp: [28, 30], face: [22, 22, 19], edge: 8, foot: { x: 206, y: 392, w: 100, h: 26, rx: 13 } },
}

/**
 * Dönme merkezleri, kenar uzunluğunun oranı olarak. Poz SVG'lerindeki
 * merkezlerin 1.07 ölçek grubundan geçmiş hali (galeri CSS'indeki
 * transform-origin değerlerinin karşılığı).
 */
export const ORIGIN = {
  /** Kısa telin dibi: (207 232) → (203.6 228.1) */
  shortWisp: [0.398, 0.445],
  /** Uzun telin dibi: (300 238) → (303.1 234.5) */
  longWisp: [0.592, 0.458],
  /** Kasenin salınım ekseni: (256 384) → (256 390.7) */
  bowl: [0.5, 0.763],
  /** Figürün yere bastığı nokta: (256 414) → (256 422.8) */
  figure: [0.5, 0.826],
  /** Gölgenin kendi merkezi. */
  shadow: [0.5, 0.854],
} as const

/**
 * transformOrigin'i PİKSEL olarak verir. React Native yüzde dizesini üç
 * bileşene açarken z'yi de yüzde sanıp patlıyor ("Transform origin z-position
 * must be a number"), o yüzden burada sayıya çeviriyoruz.
 */
export function originPx(o: readonly [number, number] | number[], size: number) {
  return [o[0] * size, o[1] * size, 0]
}

/** viewBox koordinatından transformOrigin pikseli (dekor parçaları için). */
export function originAt(cx: number, cy: number, size: number) {
  return [(cx / 512) * size, (cy / 512) * size, 0]
}

/** Katman: parçalar aynı viewBox'ta üst üste biner. */
export function Layer({ children }: { children: ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 512 512" style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  )
}

export function ShortWisp({
  rotate = 0,
  opacity,
  weight = WEIGHTS.normal,
  mini = false,
  transform = '',
}: {
  rotate?: number
  opacity?: number
  weight?: AfiWeight
  mini?: boolean
  transform?: string
}) {
  return (
    <Layer>
      <Path
        d={mini ? SHORT_WISP_MINI : SHORT_WISP}
        stroke={MINT}
        strokeWidth={weight.wisp[0]}
        strokeLinecap="round"
        fill="none"
        opacity={opacity}
        transform={`${transform}${FIG} rotate(${rotate} 207 232)`}
      />
    </Layer>
  )
}

export function LongWisp({
  tone,
  rotate = 0,
  opacity,
  weight = WEIGHTS.normal,
  mini = false,
  transform = '',
}: {
  tone: AfiTone
  rotate?: number
  opacity?: number
  weight?: AfiWeight
  mini?: boolean
  transform?: string
}) {
  return (
    <Layer>
      <Path
        d={mini ? LONG_WISP_MINI : LONG_WISP}
        stroke={tone.longWisp}
        strokeWidth={weight.wisp[1]}
        strokeLinecap="round"
        fill="none"
        opacity={opacity}
        transform={`${transform}${FIG} rotate(${rotate} 300 238)`}
      />
    </Layer>
  )
}

/** Kase + oyulmuş yüz + ayak. Yüz geometrisi marka kuralı gereği sabittir. */
export function Body({
  tone,
  rotate = 0,
  weight = WEIGHTS.normal,
  transform = '',
}: {
  tone: AfiTone
  rotate?: number
  weight?: AfiWeight
  transform?: string
}) {
  const edge = tone.contour
  const edgeWidth = edge ? weight.edge : 0
  const { foot } = weight
  return (
    <Layer>
      <G transform={`${transform}${FIG}${rotate ? ` rotate(${rotate} 256 384)` : ''}`}>
        <Path d={BOWL} fill="#ffffff" stroke={edge} strokeWidth={edgeWidth} />
        <G fill="none" stroke={FACE} strokeLinecap="round">
          <Path d={EYE_LEFT} strokeWidth={weight.face[0]} />
          <Path d={EYE_RIGHT} strokeWidth={weight.face[1]} />
          <Path d={SMILE} strokeWidth={weight.face[2]} />
        </G>
        <Rect
          x={foot.x}
          y={foot.y}
          width={foot.w}
          height={foot.h}
          rx={foot.rx}
          fill="#ffffff"
          stroke={edge}
          strokeWidth={edgeWidth}
        />
      </G>
    </Layer>
  )
}

/** Zemin gölgesi: figür havadayken (kutlama) küçülür, mini pozda hiç yoktur. */
export function Shadow({
  tone,
  cx = 256,
  cy = 437,
  rx = 116,
  ry = 14,
  dim = 1,
}: {
  tone: AfiTone
  cx?: number
  cy?: number
  rx?: number
  ry?: number
  /** Ton opaklığının çarpanı (kutlamada figür havada olduğu için gölge soluklaşır). */
  dim?: number
}) {
  return (
    <Layer>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#022c22" opacity={tone.shadow * dim} />
    </Layer>
  )
}

/**
 * Parıltı yıldızı: kutlama, merak, kaşık ve uyku pozlarının mint aksanı.
 * (x y) yıldızın TEPE noktasıdır; kısa kol r, uzun kol a (poz dosyalarındaki
 * kalıbın birebir aynısı, örn. merak: r=5 a=12).
 */
export function Sparkle({
  x,
  y,
  r = 5,
  a = 12,
  opacity = 1,
}: {
  x: number
  y: number
  r?: number
  a?: number
  opacity?: number
}) {
  return (
    <Path
      d={`M${x} ${y}l${r} ${a} ${a} ${r}-${a} ${r}-${r} ${a}-${r}-${a}-${a}-${r} ${a}-${r}z`}
      fill={MINT}
      opacity={opacity}
    />
  )
}
