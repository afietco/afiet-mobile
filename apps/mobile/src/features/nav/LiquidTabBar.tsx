import { BlurView } from 'expo-blur'
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import * as Haptics from 'expo-haptics'
import { useState, type ReactElement, type ReactNode } from 'react'
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ColorValue,
  type LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { CHROME_MAX_FONT_SCALE } from '@/ui/textScale'
import { TAB_BAR_MIN_BOTTOM_INSET, TAB_BAR_TOP_GAP, TAB_BAR_TRACK_HEIGHT } from './tabBarSpace'

/**
 * The bottom tab bar, as a pane of glass floating over the scenes.
 *
 * Two things separate it from the bar it replaces. It no longer takes up
 * layout space, because glass with an opaque page behind it is just a grey
 * rectangle: screens reserve room for it themselves (see `tabBarSpace`) and
 * their content scrolls underneath. And the selection capsule is driven by the
 * pager's own scroll position rather than by the committed route, so it
 * travels with the finger during a swipe instead of jumping when the swipe
 * lands.
 *
 * The glass itself has three tiers. iOS 26 has the real thing. Older iOS gets
 * a UIVisualEffectView, which is the same idea a generation earlier and costs
 * nothing. Android gets a translucent surface with a hairline edge: its blur
 * is still experimental and would be paid for in frames and battery on every
 * screen, every session, for an effect nobody there has a reference for.
 */

type TabRoute = { key: string; name: string; params?: object }

type TabBarOptions = {
  title?: string
  tabBarIcon?: (props: { focused: boolean; color: ColorValue }) => ReactElement
  tabBarAccessibilityLabel?: string
  tabBarButtonTestID?: string
}

/**
 * What the navigator hands its tab bar.
 *
 * Spelled out here rather than imported: the vendored `MaterialTopTabBarProps`
 * widens to `any`, which would take the checking off every one of these with
 * it.
 */
export interface TabBarRenderProps {
  state: { index: number; routes: TabRoute[] }
  descriptors: Record<string, { options: TabBarOptions }>
  navigation: {
    emit: (event: {
      type: string
      target?: string
      canPreventDefault?: boolean
    }) => { defaultPrevented: boolean }
    navigate: (name: string, params?: object) => void
  }
  /**
   * The pager's continuous position, in pages. Present once the navigator has
   * measured itself; the committed index stands in until then.
   */
  position?: Animated.AnimatedInterpolation<number>
}

/** What a screen declares its icon with. */
export type TabIconProps = { focused: boolean; color: ColorValue }

const ACTIVE_COLOR = '#059669'
const LOCKED_LIGHT = '#747884'
const LOCKED_DARK = '#020617'
const RADIUS = 36

/** Icon size the layout declares its tab icons at. */
export const TAB_BAR_ICON_SIZE = 25

/** Inset of the capsule inside the pill, on every side. */
const CAPSULE_INSET = 5

export function LiquidTabBar({
  state,
  descriptors,
  navigation,
  position,
  locked,
}: TabBarRenderProps & { locked: boolean }) {
  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const t = tokens[isDark ? 'dark' : 'light']
  const [trackWidth, setTrackWidth] = useState(0)
  const itemWidth = trackWidth / state.routes.length
  const lockedTint = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.58)'

  /* Glass is switched off entirely while the guided tour holds the bar: a
     translucent pane under the tour's own dim reads as a smudge, where the
     flat locked surface reads as deliberately out of reach. */
  const glass = !locked

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width)
  }

  /* Native-driven the whole way down: `position` comes off the pager's own
     scroll, and multiplying it never leaves that thread. */
  const capsuleShift = position
    ? Animated.multiply(position, itemWidth)
    : new Animated.Value(state.index * itemWidth)

  return (
    <View
      accessibilityRole="tablist"
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 14,
        paddingTop: TAB_BAR_TOP_GAP,
        paddingBottom: Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET),
      }}
    >
      <BarSurface glass={glass} isDark={isDark} locked={locked}>
        <View
          onLayout={handleLayout}
          style={{
            /* Grows with the label instead of clipping it. The cap on the
               label below bounds how tall this can get, so the bar stays a
               bar. */
            minHeight: TAB_BAR_TRACK_HEIGHT,
            flexDirection: 'row',
            paddingHorizontal: 4,
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 4,
              top: CAPSULE_INSET,
              bottom: CAPSULE_INSET,
              width: Math.max(0, itemWidth - 8),
              borderRadius: RADIUS - CAPSULE_INSET,
              borderCurve: 'continuous',
              opacity: locked || itemWidth === 0 ? 0 : 1,
              backgroundColor: capsuleFill(glass, isDark),
              transform: [{ translateX: capsuleShift }],
            }}
          />

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const focused = state.index === index
            const restColor = locked ? lockedTint : t.ink
            const label = options.title ?? route.name

            const onPress = () => {
              if (locked) return
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params)
                if (process.env.EXPO_OS === 'ios') void Haptics.selectionAsync()
              }
            }

            const onLongPress = () => {
              if (locked) return
              navigation.emit({ type: 'tabLongPress', target: route.key })
            }

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={options.tabBarAccessibilityLabel}
                accessibilityState={{ selected: focused, disabled: locked }}
                testID={options.tabBarButtonTestID}
                disabled={locked}
                onPress={onPress}
                onLongPress={onLongPress}
                style={{ zIndex: 1, flex: 1 }}
              >
                <TabItem
                  index={index}
                  focused={focused}
                  position={position}
                  activeColor={locked ? lockedTint : ACTIVE_COLOR}
                  restColor={restColor}
                  label={label}
                  renderIcon={options.tabBarIcon}
                />
              </Pressable>
            )
          })}
        </View>
      </BarSurface>
    </View>
  )
}

/** The capsule reads as a highlight on glass and as a chip on a flat bar. */
function capsuleFill(glass: boolean, isDark: boolean): string {
  if (!glass) return isDark ? '#1e293b' : '#e7ecef'
  return isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.58)'
}

/**
 * The pane the items sit on.
 *
 * Rounding has to be clipped here rather than on the children, because both
 * the blur view and the glass view fill their own bounds.
 */
function BarSurface({
  glass,
  isDark,
  locked,
  children,
}: {
  glass: boolean
  isDark: boolean
  locked: boolean
  children: ReactNode
}) {
  const t = tokens[isDark ? 'dark' : 'light']
  const shape = {
    borderRadius: RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as const

  if (!glass) {
    return (
      <View style={[shape, { backgroundColor: locked ? (isDark ? LOCKED_DARK : LOCKED_LIGHT) : t.surface }]}>
        {children}
      </View>
    )
  }

  /* A drop shadow is what tells the eye the pane is floating rather than
     painted on. It sits on a wrapper because the clipping above would eat it,
     and the wrapper repeats the radius so the shadow is pill shaped rather
     than a rectangle cast from behind a pill. */
  const floating = {
    borderRadius: RADIUS,
    borderCurve: 'continuous',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.16)',
  } as const

  if (isLiquidGlassAvailable()) {
    return (
      <View style={floating}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={shape}
        >
          {children}
        </GlassView>
      </View>
    )
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={floating}>
        <BlurView
          intensity={64}
          tint={isDark ? 'systemThickMaterialDark' : 'systemThickMaterialLight'}
          style={shape}
        >
          {children}
        </BlurView>
      </View>
    )
  }

  /* Android. No blur by choice, so the surface carries the separation on its
     own: enough opacity to stay legible over any card, plus the hairline that
     keeps it from dissolving into a pale page. */
  return (
    <View style={floating}>
      <View
        style={[
          shape,
          {
            backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.92)',
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.line,
          },
        ]}
      >
        {children}
      </View>
    </View>
  )
}

/**
 * One tab, in two stacked copies.
 *
 * The resting copy is in flow and sets the item's size; the active copy is
 * laid over it and fades in as the pager arrives, which is the only way to
 * move a colour on the same thread the swipe runs on. Both copies get
 * identical text props so they wrap identically at every font scale.
 */
function TabItem({
  index,
  focused,
  position,
  activeColor,
  restColor,
  label,
  renderIcon,
}: {
  index: number
  focused: boolean
  position?: Animated.AnimatedInterpolation<number>
  activeColor: string
  restColor: string
  label: string
  renderIcon?: (props: { focused: boolean; color: ColorValue }) => ReactElement
}) {
  const nearness = nearnessOf(index, focused, position)

  return (
    <Animated.View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        transform: [
          { translateY: Animated.multiply(nearness, -1) },
          {
            scale: nearness.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.035],
            }),
          },
        ],
      }}
    >
      <Face color={restColor} focused={false} label={label} renderIcon={renderIcon} />
      <Animated.View
        pointerEvents="none"
        /* The second copy is the same label painted another colour. Hidden
           from assistive technology so a tab is not announced twice. */
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          opacity: nearness,
        }}
      >
        <Face color={activeColor} focused label={label} renderIcon={renderIcon} />
      </Animated.View>
    </Animated.View>
  )
}

function Face({
  color,
  focused,
  label,
  renderIcon,
}: {
  color: string
  focused: boolean
  label: string
  renderIcon?: (props: { focused: boolean; color: ColorValue }) => ReactElement
}) {
  return (
    <>
      {renderIcon ? renderIcon({ focused, color }) : null}
      {/* The one place in the app where text is capped. A tab bar that grows
          to three times its height stops being a tab bar, and these are four
          words the icons already stand for. Two lines rather than one, so a
          capped label is still whole. */}
      <AppText
        numberOfLines={2}
        allowFontScaling
        maxFontSizeMultiplier={CHROME_MAX_FONT_SCALE}
        weight={focused ? 'bold' : 'semibold'}
        style={{ color, fontSize: 12, textAlign: 'center' }}
      >
        {label}
      </AppText>
    </>
  )
}

/** 1 when the pager is centred on this tab, 0 once it is a full page away. */
function nearnessOf(
  index: number,
  focused: boolean,
  position?: Animated.AnimatedInterpolation<number>,
): Animated.AnimatedInterpolation<number> | Animated.Value {
  if (!position) return new Animated.Value(focused ? 1 : 0)
  /* Clamped on both ends so the first and last tabs do not read as "arriving"
     when the pager overscrolls past them. */
  return position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  })
}
