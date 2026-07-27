import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { Ellipse } from 'react-native-svg'
import { useTheme } from '@/theme/useTheme'
import { Bubbles, ConfettiBurst, Glass, Moon, SleepCap, Spoon, Stars } from './decor'
import {
  CheckBadge,
  Hearts,
  LevelBurst,
  Magnifier,
  OfflineCloud,
  RhythmDots,
  ScanLine,
  SignalArcs,
  StarBadge,
  ThinkingDots,
  Viewfinder,
} from './decor-v2'
import { onceDuration, useAfiMotion, type AfiMotion, type AfiMotionStyles } from './motion'
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
import { SPICES } from './spices'

/**
 * Afi maskotu: poz + hareket.
 *
 *   <AfiPose pose="kutlama" motion="zipla" size={96} />
 *   <AfiPose pose="temel" intro="giris" motion="nefes" />
 *   <AfiPose pose="kasik" onPress={ekle} accessibilityLabel="Afi, ilk kaydını bekliyor" />
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
 * statik pozunda durur. Maskot varsayılan olarak DEKORATİFTİR ve ekran
 * okuyucudan gizlidir; `accessibilityLabel` verildiğinde görünür olur.
 * `onPress` verilmedikçe dokunmaları da geçirir.
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
  // v2 · günlük durum
  | 'arama'
  | 'cevrimdisi'
  | 'sicaklik'
  // v2 · Afi asistan
  | 'foto'
  | 'dusunuyor'
  | 'buldum'
  // v2 · oyunlaştırma
  | 'seviye'
  | 'rozet'
  | 'ritim'
  // v2 · lig kademeleri (anahtarlar @afiet/core LeagueTierKey ile birebir)
  | 'lig-tuz'
  | 'lig-nane'
  | 'lig-kekik'
  | 'lig-sumak'
  | 'lig-safran'

/** Dekor parçalarının ortak girdisi. */
interface DecorProps {
  anim: AfiMotionStyles
  size: number
  tone: AfiTone
}

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
  /**
   * Pozun dekor saati (ms). Dekor hareketi pozun kendi özelliğidir: aynı poz
   * farklı figür hareketleriyle kullanılsa da mercek taramaya, noktalar
   * yanıp sönmeye devam eder. Verilmezse hareketin saati kullanılır.
   */
  decorMs?: number
  /** Figürün arkasına düşen dekor. */
  back?: (p: DecorProps) => ReactNode
  /** Figürün önüne düşen dekor. */
  front?: (p: DecorProps) => ReactNode
}

/** Lig kademesi pozlarını tek kalıptan üretir: baharat önde, figür sakin. */
function ligPose(key: keyof typeof SPICES): PoseSpec {
  const Spice = SPICES[key]
  return { wisp: [0, 0], shadow: {}, motion: 'idle', front: () => <Spice /> }
}

const POSES: Record<AfiPoseName, PoseSpec> = {
  temel: { wisp: [0, 0], shadow: {}, motion: 'idle' },
  selam: { wisp: [-8, 26], bowl: -5, shadow: {}, motion: 'selam' },
  kutlama: {
    wisp: [-16, 16],
    shift: { y: -22 },
    shadow: { rx: 86, ry: 11, dim: 0.75 },
    motion: 'zipla',
    front: ({ anim, size }) => (
      <ConfettiBurst decor={anim.decor} reduced={anim.reduced} size={size} />
    ),
  },
  merak: {
    wisp: [4, 8],
    shift: { rotate: 7, at: [256, 414] },
    shadow: {},
    motion: 'idle',
    front: () => (
      <Layer>
        <Sparkle x={404} y={128} />
      </Layer>
    ),
  },
  uyku: {
    wisp: [6, -6],
    wispOpacity: 0.65,
    shadow: {},
    motion: 'uyku',
    back: ({ anim }) => (
      <>
        <Moon />
        <Stars decor={anim.decor} reduced={anim.reduced} />
      </>
    ),
    front: () => <SleepCap />,
  },
  aile: { wisp: [0, 0], shadow: { cx: 250, cy: 440, rx: 200, ry: 15 }, motion: 'aile' },
  su: {
    wisp: [0, 0],
    shift: { x: -26 },
    shadow: { cx: 230, rx: 112 },
    motion: 'idle',
    back: ({ tone }) => (
      <Layer>
        <Ellipse cx={446} cy={428} rx={36} ry={7} fill="#022c22" opacity={tone.shadow * 0.75} />
      </Layer>
    ),
    // Yudum hareketinde bardak figürle birlikte oynar, yoksa statik durur.
    front: ({ anim, size }) => (
      <Glass sip={anim.decor} reduced={anim.reduced} size={size} />
    ),
  },
  kasik: {
    wisp: [0, 0],
    shadow: { rx: 128 },
    motion: 'idle',
    back: () => <Spoon />,
    front: () => (
      <Layer>
        <Sparkle x={112} y={172} />
      </Layer>
    ),
  },
  // Hata pozu marka tablosunda statiktir: şefkati duruş ve mikro kopya taşır.
  oops: { wisp: [30, -26], shift: { rotate: -8, at: [256, 414] }, shadow: {}, motion: 'yok' },
  mini: { wisp: [0, 0], shadow: null, motion: 'yok' },

  arama: {
    wisp: [0, 0],
    shadow: {},
    motion: 'idle',
    decorMs: 3600,
    front: ({ anim, size }) => (
      <Magnifier decor={anim.decor} reduced={anim.reduced} size={size} />
    ),
  },
  cevrimdisi: {
    wisp: [-4, 6],
    shadow: {},
    motion: 'nefes',
    decorMs: 3000,
    back: ({ anim, size, tone }) => (
      <OfflineCloud decor={anim.decor} reduced={anim.reduced} size={size} tone={tone} />
    ),
    front: ({ anim }) => <SignalArcs decor={anim.decor} reduced={anim.reduced} />,
  },
  sicaklik: {
    wisp: [0, 0],
    shadow: {},
    motion: 'nefes',
    decorMs: 2400,
    front: ({ anim, size }) => <Hearts decor={anim.decor} reduced={anim.reduced} size={size} />,
  },

  foto: {
    wisp: [0, 0],
    shadow: {},
    motion: 'nefes',
    decorMs: 2400,
    back: ({ anim }) => <Viewfinder decor={anim.decor} reduced={anim.reduced} />,
    front: ({ anim, size }) => <ScanLine decor={anim.decor} reduced={anim.reduced} size={size} />,
  },
  dusunuyor: {
    wisp: [0, 0],
    wispOpacity: 0.8,
    shadow: {},
    motion: 'nefes',
    decorMs: 1500,
    front: ({ anim, size }) => (
      <ThinkingDots decor={anim.decor} reduced={anim.reduced} size={size} />
    ),
  },
  buldum: {
    wisp: [0, 0],
    shadow: {},
    motion: 'nefes',
    decorMs: 2600,
    front: ({ anim, size }) => <CheckBadge decor={anim.decor} reduced={anim.reduced} size={size} />,
  },

  seviye: {
    wisp: [-10, 10],
    shift: { y: -22 },
    shadow: { rx: 92, ry: 12, dim: 0.75 },
    motion: 'zipla',
    decorMs: 2800,
    back: ({ anim, size }) => <LevelBurst decor={anim.decor} reduced={anim.reduced} size={size} />,
  },
  rozet: {
    wisp: [0, 0],
    shadow: {},
    motion: 'nefes',
    decorMs: 3200,
    front: ({ anim, size }) => <StarBadge decor={anim.decor} reduced={anim.reduced} size={size} />,
  },
  ritim: {
    wisp: [0, 0],
    shadow: {},
    motion: 'idle',
    decorMs: 3500,
    front: ({ anim, size }) => <RhythmDots decor={anim.decor} reduced={anim.reduced} size={size} />,
  },

  'lig-tuz': ligPose('tuz'),
  'lig-nane': ligPose('nane'),
  'lig-kekik': ligPose('kekik'),
  'lig-sumak': ligPose('sumak'),
  'lig-safran': ligPose('safran'),
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
  intro,
  trigger = 0,
  size = 96,
  tone,
  style,
  accessibilityLabel,
  onPress,
  haptic = 'selection',
}: {
  pose?: AfiPoseName
  /** Verilmezse pozun varsayılan hareketi kullanılır. */
  motion?: AfiMotion
  /**
   * Bir kez oynayıp `motion`'a devredecek giriş hareketi. Sheet ve modal
   * açılışlarında Afi belirmez, yerleşir. reduceMotion açıkken atlanır.
   */
  intro?: AfiMotion
  /**
   * Tek atışlık hareketleri (`pop`, `zafer`, `giris`…) yeniden oynatmak için
   * artan sayaç. Aynı bileşen ekranda kalırken ikinci kayıt onayı geldiğinde
   * Afi'nin tepkisiz kalmaması için var.
   */
  trigger?: number
  size?: number
  /** Verilmezse temadan gelir. */
  tone?: 'light' | 'dark'
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  /**
   * Verilirse maskot dokunulabilir olur ve her dokunuşta `dokunma` hareketi
   * oynar. Verilmezse maskot dekoratiftir ve dokunmaları altındaki öğeye
   * geçirir (varsayılan davranış).
   */
  onPress?: () => void
  /** Dokunma haptiği; `false` ile kapatılır. */
  haptic?: 'selection' | 'success' | false
}) {
  const { isDark } = useTheme()
  const spec = POSES[pose]
  const t = TONES[tone ?? (isDark ? 'dark' : 'light')]
  const loop = motion ?? spec.motion

  // Giriş hareketi: süresi dolunca döngüye devreder.
  const [introDone, setIntroDone] = useState(!intro)
  useEffect(() => {
    if (!intro) {
      setIntroDone(true)
      return
    }
    setIntroDone(false)
    const ms = onceDuration(intro) || 520
    const id = setTimeout(() => setIntroDone(true), ms)
    return () => clearTimeout(id)
  }, [intro])

  // Dokunma: kısa bir tek atış, sonra normale döner.
  const [tap, setTap] = useState(0)
  useEffect(() => {
    if (!tap) return
    const id = setTimeout(() => setTap(0), onceDuration('dokunma'))
    return () => clearTimeout(id)
  }, [tap])

  const handlePress = useCallback(() => {
    setTap((n) => n + 1)
    if (haptic === 'selection') void Haptics.selectionAsync()
    else if (haptic === 'success')
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onPress?.()
  }, [haptic, onPress])

  const active: AfiMotion = tap ? 'dokunma' : introDone ? loop : (intro as AfiMotion)
  const anim = useAfiMotion(active, size, trigger + tap, spec.decorMs)
  const prefix = shiftOf(spec.shift)
  const decorProps: DecorProps = { anim, size, tone: t }

  const figure = (
    <>
      {spec.shadow && (
        <Moving origin={originPx(ORIGIN.shadow, size)} style={anim.shadow}>
          <Shadow tone={t} {...spec.shadow} />
        </Moving>
      )}

      {spec.back?.(decorProps)}

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

      {spec.front?.(decorProps)}

      {/* heyecan poza değil harekete bağlıdır: hangi pozda olursa fokurdar */}
      {active === 'heyecan' && (
        <Bubbles decor={anim.decor} reduced={anim.reduced} size={size} />
      )}
    </>
  )

  const box: StyleProp<ViewStyle> = [{ width: size, height: size }, style]

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={box}
      >
        {figure}
      </Pressable>
    )
  }

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel !== undefined ? 'image' : undefined}
      pointerEvents="none"
      style={box}
    >
      {figure}
    </View>
  )
}

export type { AfiMotion } from './motion'
