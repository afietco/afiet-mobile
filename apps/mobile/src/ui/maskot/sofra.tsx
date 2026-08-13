import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import { useTheme } from '@/theme/useTheme'
import { useAfiMotion } from './motion'
import { Layer, originAt } from './parts'

/**
 * Sini and Demi: the other two of the sofra takımı.
 *
 * Ports of `afiet-brand/maskot/sini-temel.svg` and `demi-temel.svg`, which are
 * one pose each. They are sofra OBJECTS in their own right rather than Afi in a
 * costume: Sini is the round tray of a floor table (the nutrition assistant,
 * whose subject is the week's proportions) and Demi is the teapot (the support
 * assistant, whose subject is whatever is left once the meal is over). Afi
 * stays the bowl, the host, free and all day long.
 *
 * Each keeps its own fixed face, which is the rule that replaced "the face
 * never changes": Sini shares Afi's closed happy eyes, Demi's are open, because
 * his whole job is to be listening.
 *
 * The volume layer is the one the brand round approved: a fading radial ground
 * shadow, a porcelain gradient, one top-left light, and a `#dccbaa` contour.
 * No blur anywhere, which is exactly why this port is a straight transcription:
 * react-native-svg carries gradients but not blur filters.
 *
 * Motion is Afi's own `nefes`, borrowed rather than reinvented, so all three
 * breathe on one clock and obey the same motion gate. Demi's steam runs on the
 * wisp clock instead, so it drifts and fades the way Afi's does.
 *
 * Gradients are declared per layer because every layer is its own `<Svg>` and a
 * definition does not cross that boundary.
 */

export interface SofraMascotProps {
  size?: number
  style?: StyleProp<ViewStyle>
  /** Decorative unless labelled, like every mascot in the app. */
  accessibilityLabel?: string
  /** Overrides the theme. A dark ground only changes Demi's steam. */
  tone?: 'light' | 'dark'
}

const CONTOUR = '#dccbaa'
const FACE = '#047857'

/** The porcelain body fill, identical for both characters. */
function Porcelain({ id }: { id: string }) {
  return (
    <LinearGradient id={id} x1="0.25" y1="0" x2="0.7" y2="1">
      <Stop offset="0" stopColor="#ffffff" />
      <Stop offset="0.5" stopColor="#fdfaf3" />
      <Stop offset="1" stopColor="#efe5d3" />
    </LinearGradient>
  )
}

/** The ground shadow, which fades out rather than being blurred. */
function GroundShadow({
  id,
  cx,
  cy,
  rx,
  ry,
}: {
  id: string
  cx: number
  cy: number
  rx: number
  ry: number
}) {
  return (
    <Layer>
      <Defs>
        <RadialGradient id={id}>
          <Stop offset="0" stopColor="#022c22" stopOpacity="0.2" />
          <Stop offset="0.55" stopColor="#022c22" stopOpacity="0.09" />
          <Stop offset="1" stopColor="#022c22" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </Layer>
  )
}

/**
 * A layer that moves on its own, over the same 512 viewBox as the others.
 *
 * Deliberately a local copy of the wrapper `AfiPose` uses rather than an import
 * from it: that module is the whole 24-pose figure, and these two need eight
 * lines of it. The origin arrives in PIXELS (`originAt` converts it from the
 * drawing's own units), because a transform origin given in viewBox units is
 * the calibration mistake this port has already made once.
 */
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

function Frame({
  size,
  style,
  accessibilityLabel,
  children,
}: {
  size: number
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  children: React.ReactNode
}) {
  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel !== undefined ? 'image' : undefined}
      pointerEvents="none"
      style={[{ width: size, height: size }, style]}
    >
      {children}
    </View>
  )
}

/**
 * Sini: the round tray. Her signature is the ring of five food-group dishes on
 * the rim, which is the character in one image: what she talks about is
 * proportion, never amount.
 *
 * The body is one silhouette path with the top surface drawn over it, not two
 * stacked ellipses. Stacked, it read as two plates; the thickness of the rim is
 * told with tone rather than with a line, for the same reason.
 */
export function SiniPose({ size = 96, style, accessibilityLabel }: SofraMascotProps) {
  const anim = useAfiMotion('nefes', size)

  return (
    <Frame size={size} style={style} accessibilityLabel={accessibilityLabel}>
      <GroundShadow id="sini-golge" cx={256} cy={452} rx={176} ry={30} />

      <Moving origin={originAt(256, 400, size)} style={anim.figure}>
        <Layer>
          <Defs>
            <Porcelain id="sini-porselen" />
            {/* The hollow: shaded at the top, lit at the bottom, so it reads as
                concave rather than as a second disc laid on top. */}
            <LinearGradient id="sini-cukur" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#eee4d1" />
              <Stop offset="0.55" stopColor="#fbf6ec" />
              <Stop offset="1" stopColor="#fffdf8" />
            </LinearGradient>
            <LinearGradient id="sini-yan" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#e9dcc6" />
              <Stop offset="1" stopColor="#d6c4a4" />
            </LinearGradient>
            <RadialGradient id="sini-isik" cx="0.32" cy="0.24" r="0.5">
              <Stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
              <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* The rim's thickness: its upper edge is the lower arc of the
              surface, which is then drawn over it and closes the seam. */}
          <Path
            d="M90 292A166 102 0 0 0 422 292L408 324A152 94 0 0 1 104 324Z"
            fill="url(#sini-yan)"
            stroke={CONTOUR}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Ellipse
            cx={256}
            cy={292}
            rx={166}
            ry={102}
            fill="url(#sini-porselen)"
            stroke={CONTOUR}
            strokeWidth={4}
          />
          <Ellipse
            cx={256}
            cy={292}
            rx={122}
            ry={66}
            fill="url(#sini-cukur)"
            stroke={CONTOUR}
            strokeWidth={3}
          />
          <Ellipse cx={206} cy={256} rx={88} ry={40} fill="url(#sini-isik)" />

          {/* Five dishes, in the five food-group colours. */}
          <G stroke="#ffffff" strokeWidth={3}>
            <Ellipse cx={136} cy={252} rx={26} ry={16} fill="#059669" />
            <Ellipse cx={187} cy={223} rx={26} ry={16} fill="#f43f5e" />
            <Ellipse cx={256} cy={212} rx={26} ry={16} fill="#f59e0b" />
            <Ellipse cx={325} cy={223} rx={26} ry={16} fill="#f97316" />
            <Ellipse cx={376} cy={252} rx={26} ry={16} fill="#0ea5e9" />
          </G>

          {/* Afi's face: closed happy eyes. Two content, one listening. */}
          <G fill="none" stroke={FACE} strokeLinecap="round">
            <Path d="M188 314q21-19 42 0" strokeWidth={14} />
            <Path d="M282 314q21-19 42 0" strokeWidth={14} />
            <Path d="M238 342q18 13 36 0" strokeWidth={12} />
          </G>
        </Layer>
      </Moving>
    </Frame>
  )
}

/**
 * Demi: the teapot. His signature is the single curved wisp off the spout,
 * deliberately unlike Afi's two upright ones, plus the amber lid knob, which is
 * tea's one colour accent.
 *
 * Never put a downward-tapering motif on the body: a drop, a tulip, a leaf.
 * Under that face it reads as a tear, and that was found the hard way.
 */
export function DemiPose({ size = 96, style, accessibilityLabel, tone }: SofraMascotProps) {
  const { isDark } = useTheme()
  const anim = useAfiMotion('nefes', size)
  const dark = (tone ?? (isDark ? 'dark' : 'light')) === 'dark'

  return (
    <Frame size={size} style={style} accessibilityLabel={accessibilityLabel}>
      <GroundShadow id="demi-golge" cx={258} cy={444} rx={134} ry={28} />

      {/* The steam runs on the wisp clock rather than the body's, so it drifts
          and fades the way Afi's does instead of merely scaling with the pot.
          Its far stop goes white on a dark ground, which is Afi's rule: the
          brand green end otherwise disappears into a dark surface. */}
      <Moving origin={originAt(114, 232, size)} style={anim.shortWisp}>
        <Layer>
          <Defs>
            <LinearGradient id="demi-buhar" x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={dark ? '#ffffff' : '#a7f3d0'} />
              <Stop offset="1" stopColor={dark ? '#a7f3d0' : '#059669'} />
            </LinearGradient>
          </Defs>
          <Path
            d="M114 232c0-17 15-20 15-37s-15-19-15-35"
            fill="none"
            stroke="url(#demi-buhar)"
            strokeWidth={20}
            strokeLinecap="round"
          />
        </Layer>
      </Moving>

      <Moving origin={originAt(258, 418, size)} style={anim.figure}>
        <Layer>
          <Defs>
            <Porcelain id="demi-porselen" />
            <RadialGradient id="demi-isik" cx="0.34" cy="0.26" r="0.52">
              <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
              <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Handle and spout are filled paths that taper towards their tips,
              not strokes of one width; both start inside the body so the join
              is covered once the body is drawn over them. */}
          <Path
            d="M342 278c64 6 86 50 58 90c-12 17-30 28-48 33l-2-22c13-4 25-13 32-23c18-26 6-50-30-53z"
            fill="url(#demi-porselen)"
            stroke={CONTOUR}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Path
            d="M166 350C140 326 112 290 98 254l30-12c16 38 36 62 62 78z"
            fill="url(#demi-porselen)"
            stroke={CONTOUR}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Path
            d="M202 250C174 258 156 282 154 312C152 352 170 388 200 402L316 402C346 388 364 352 362 312C360 282 342 258 314 250Z"
            fill="url(#demi-porselen)"
            stroke={CONTOUR}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Ellipse cx={228} cy={292} rx={64} ry={48} fill="url(#demi-isik)" />

          {/* Lid: flange plus dome, then the amber knob. */}
          <Path
            d="M208 248c4-24 24-36 50-36s46 12 50 36z"
            fill="url(#demi-porselen)"
            stroke={CONTOUR}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <Ellipse
            cx={258}
            cy={250}
            rx={62}
            ry={15}
            fill="url(#demi-porselen)"
            stroke={CONTOUR}
            strokeWidth={4}
          />
          <Circle cx={258} cy={206} r={13} fill="#f59e0b" stroke="#ffffff" strokeWidth={3} />

          {/* The listening face: open eyes, one thin soft smile. */}
          <G fill={FACE}>
            <Ellipse cx={224} cy={318} rx={12} ry={14} />
            <Ellipse cx={292} cy={318} rx={12} ry={14} />
          </G>
          <Path
            d="M240 352q18 11 36 0"
            fill="none"
            stroke={FACE}
            strokeWidth={12}
            strokeLinecap="round"
          />

          <Rect
            x={214}
            y={400}
            width={88}
            height={18}
            rx={9}
            fill="url(#demi-porselen)"
            stroke={CONTOUR}
            strokeWidth={4}
          />
        </Layer>
      </Moving>
    </Frame>
  )
}
