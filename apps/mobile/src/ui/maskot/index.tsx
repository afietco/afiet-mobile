import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { Ellipse } from 'react-native-svg'
import { useTheme } from '@/theme/useTheme'
import { Bubbles, ConfettiBurst, Glass, Moon, SleepCap, Spoon, Stars } from './decor'
import { useAfiMotion, type AfiMotion, type AfiMotionStyles } from './motion'
import {
  Body,
  Layer,
  LongWisp,
  ORIGIN,
  originAt,
  originPx,
  Shadow,
  ShortWisp,
  Sparkle,
  TONES,
  WEIGHTS,
  type AfiTone,
} from './parts'

/**
 * Afi maskotu: poz + hareket.
 *
 *   <AfiPose pose="kutlama" motion="zipla" size={96} />
 *
 * Pozlar afiet-brand/maskot/afi-*.svg dosyalarının portudur, hareketler aynı
 * klasördeki galerinin 03/06 bölümlerinden gelir. Her pozun kendi varsayılan
 * hareketi vardır, `motion` ile ezilebilir.
 *
 * Ton (açık/koyu) temadan gelir: koyu zeminde uzun tel beyaza döner ve kontur
 * kalkar (maskot/README.md buhar paleti kuralı). Beyaz kart üstünde koyu temada
 * bile açık ton isteniyorsa `tone="light"` verilir.
 *
 * Erişilebilirlik: reduceMotion açıkken hiçbir animasyon başlamaz, figür
 * statik pozunda durur.
 */

export type AfiPoseName =
  | 'temel'
  | 'selam'
  | 'kutlama'
  | 'merak'
  | 'uyku'
  | 'aile'
  | 'su'
  | 'kasik'
  | 'oops'
  | 'mini'

interface PoseSpec {
  /** Kısa ve uzun buhar telinin statik açısı. */
  wisp: [number, number]
  /** Buhar opaklığı (uyku pozunda teller soluklaşır). */
  wispOpacity?: number
  /** Kasenin statik açısı (selam pozunda yaslanır). */
  bowl?: number
  /** Figürün poz dosyasındaki dış yerleşimi. */
  shift?: { x?: number; y?: number; rotate?: number; at?: [number, number] }
  /** Zemin gölgesi; null ise gölge yok. */
  shadow: { cx?: number; cy?: number; rx?: number; ry?: number; dim?: number } | null
  /** Pozun varsayılan hareketi. */
  motion: AfiMotion
}

const POSES: Record<AfiPoseName, PoseSpec> = {
  temel: { wisp: [0, 0], shadow: {}, motion: 'idle' },
  selam: { wisp: [-8, 26], bowl: -5, shadow: {}, motion: 'selam' },
  kutlama: {
    wisp: [-16, 16],
    shift: { y: -22 },
    shadow: { rx: 86, ry: 11, dim: 0.75 },
    motion: 'zipla',
  },
  merak: { wisp: [4, 8], shift: { rotate: 7, at: [256, 414] }, shadow: {}, motion: 'idle' },
  uyku: { wisp: [6, -6], wispOpacity: 0.65, shadow: {}, motion: 'uyku' },
  aile: { wisp: [0, 0], shadow: { cx: 250, cy: 440, rx: 200, ry: 15 }, motion: 'aile' },
  su: { wisp: [0, 0], shift: { x: -26 }, shadow: { cx: 230, rx: 112 }, motion: 'idle' },
  kasik: { wisp: [0, 0], shadow: { rx: 128 }, motion: 'idle' },
  // Hata pozu marka tablosunda statiktir: şefkati duruş ve mikro kopya taşır.
  oops: { wisp: [30, -26], shift: { rotate: -8, at: [256, 414] }, shadow: {}, motion: 'yok' },
  mini: { wisp: [0, 0], shadow: null, motion: 'yok' },
}

/** Poz dosyasındaki dış transform'u SVG dizesine çevirir. */
function shiftOf(s: PoseSpec['shift']) {
  if (!s) return ''
  const out: string[] = []
  if (s.x || s.y) out.push(`translate(${s.x ?? 0} ${s.y ?? 0})`)
  if (s.rotate) out.push(`rotate(${s.rotate} ${s.at?.[0] ?? 256} ${s.at?.[1] ?? 414})`)
  return out.length ? `${out.join(' ')} ` : ''
}

/** Katman sarmalayıcı: mutlak konum + kendi dönme ekseni (piksel). */
function Moving({
  origin,
  style,
  children,
}: {
  origin: number[]
  style?: StyleProp<AnimatedStyle<ViewStyle>>
  children: React.ReactNode
}) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transformOrigin: origin }, style]}
    >
      {children}
    </Animated.View>
  )
}

/** Tek figür: iki tel + kase. Aile pozunda iki kez kullanılır. */
function Figure({
  tone,
  anim,
  spec,
  size,
  prefix = '',
  weight = WEIGHTS.normal,
  mini = false,
  /** Kase katmanı aux hareketini alsın mı (aile pozunda yavru alır). */
  bowlAnimated = true,
}: {
  tone: AfiTone
  anim: AfiMotionStyles
  spec: PoseSpec
  size: number
  prefix?: string
  weight?: typeof WEIGHTS.normal
  mini?: boolean
  bowlAnimated?: boolean
}) {
  return (
    <>
      <Moving origin={originPx(ORIGIN.shortWisp, size)} style={anim.shortWisp}>
        <ShortWisp
          rotate={spec.wisp[0]}
          opacity={spec.wispOpacity}
          weight={weight}
          mini={mini}
          transform={prefix}
        />
      </Moving>
      <Moving origin={originPx(ORIGIN.longWisp, size)} style={anim.longWisp}>
        <LongWisp
          tone={tone}
          rotate={spec.wisp[1]}
          opacity={spec.wispOpacity}
          weight={weight}
          mini={mini}
          transform={prefix}
        />
      </Moving>
      <Moving origin={originPx(ORIGIN.bowl, size)} style={bowlAnimated ? anim.aux : undefined}>
        <Body tone={tone} rotate={spec.bowl} weight={weight} transform={prefix} />
      </Moving>
    </>
  )
}

/** Aile pozu: büyük Afi süzülür, yavru kase yanına sokulup hoplar. */
function AileFigure({
  tone,
  anim,
  spec,
  size,
}: {
  tone: AfiTone
  anim: AfiMotionStyles
  spec: PoseSpec
  size: number
}) {
  return (
    <>
      <Moving origin={originPx(ORIGIN.figure, size)} style={anim.figure}>
        <Figure
          tone={tone}
          anim={anim}
          spec={spec}
          size={size}
          prefix="translate(-70 22) scale(.95) "
          bowlAnimated={false}
        />
      </Moving>
      {/* yavrunun ekseni kendi tabanı: ayak (256 414), zincirden geçince (339 416) */}
      <Moving origin={originAt(339, 416, size)} style={anim.aux}>
        <Figure
          tone={tone}
          anim={anim}
          spec={spec}
          size={size}
          prefix="translate(224 230) scale(.44) rotate(-7 256 384) "
          weight={WEIGHTS.yavru}
          bowlAnimated={false}
        />
      </Moving>
    </>
  )
}

export function AfiPose({
  pose = 'temel',
  motion,
  size = 96,
  tone,
  style,
  accessibilityLabel,
}: {
  pose?: AfiPoseName
  /** Verilmezse pozun varsayılan hareketi kullanılır. */
  motion?: AfiMotion
  size?: number
  /** Verilmezse temadan gelir. */
  tone?: 'light' | 'dark'
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  const { isDark } = useTheme()
  const spec = POSES[pose]
  const t = TONES[tone ?? (isDark ? 'dark' : 'light')]
  const active = motion ?? spec.motion
  const anim = useAfiMotion(active, size)
  const prefix = shiftOf(spec.shift)

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel !== undefined ? 'image' : undefined}
      pointerEvents="none"
      style={[{ width: size, height: size }, style]}
    >
      {spec.shadow && (
        <Moving origin={originPx(ORIGIN.shadow, size)} style={anim.shadow}>
          <Shadow tone={t} {...spec.shadow} />
        </Moving>
      )}

      {/* figürün arkasına düşen dekor */}
      {pose === 'kasik' && <Spoon />}
      {pose === 'uyku' && <Moon />}
      {pose === 'uyku' && <Stars decor={anim.decor} reduced={anim.reduced} />}
      {pose === 'su' && (
        <Layer>
          <Ellipse cx={446} cy={428} rx={36} ry={7} fill="#022c22" opacity={t.shadow * 0.75} />
        </Layer>
      )}

      {pose === 'aile' ? (
        <AileFigure tone={t} anim={anim} spec={spec} size={size} />
      ) : (
        <Moving origin={originPx(ORIGIN.figure, size)} style={anim.figure}>
          <Figure
            tone={t}
            anim={anim}
            spec={spec}
            size={size}
            prefix={pose === 'mini' ? 'translate(256 296) scale(1.32) translate(-256 -296) ' : prefix}
            weight={pose === 'mini' ? WEIGHTS.mini : WEIGHTS.normal}
            mini={pose === 'mini'}
          />
        </Moving>
      )}

      {/* figürün önüne düşen dekor */}
      {pose === 'uyku' && <SleepCap />}
      {pose === 'su' && <Glass />}
      {pose === 'merak' && (
        <Layer>
          <Sparkle x={404} y={128} />
        </Layer>
      )}
      {pose === 'kasik' && (
        <Layer>
          <Sparkle x={112} y={172} />
        </Layer>
      )}
      {pose === 'kutlama' && (
        <ConfettiBurst decor={anim.decor} reduced={anim.reduced} size={size} />
      )}
      {active === 'heyecan' && (
        <Bubbles decor={anim.decor} reduced={anim.reduced} size={size} />
      )}
    </View>
  )
}

export type { AfiMotion } from './motion'
