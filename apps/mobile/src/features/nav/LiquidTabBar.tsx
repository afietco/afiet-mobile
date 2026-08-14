import { BlurView } from 'expo-blur'
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react'
import {
  Animated,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ColorValue,
  type LayoutChangeEvent,
} from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { trackTap } from '@/lib/track'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { AfiPose } from '@/ui/maskot'
import { CHROME_MAX_FONT_SCALE } from '@/ui/textScale'
import {
  TAB_BAR_ACTION_RAISE,
  TAB_BAR_ACTION_SIZE,
  TAB_BAR_MIN_BOTTOM_INSET,
  TAB_BAR_TOP_GAP,
  TAB_BAR_TRACK_HEIGHT,
} from './tabBarSpace'

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
 *
 * The middle slot is not a tab. Afi stands there, half above the pane, and
 * opens the things people come here to do rather than a page: two records and
 * three conversations (`QuickActions`). The bar therefore has five slots and
 * four pages, and the capsule maps the pager's position onto the slots the
 * pages actually occupy, which is why the shift below is an interpolation with
 * a hole in it rather than a multiplication.
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
  /** Afi's slot. The layout owns it because its menu opens the layout's sheets. */
  action?: TabBarAction
}

export interface TabBarAction {
  open: boolean
  onToggle: () => void
  onClose: () => void
  /** What the menu shows. Rendered only while it is open. */
  menu: ReactNode
}

/** What a screen declares its icon with. */
export type TabIconProps = { focused: boolean; color: ColorValue }

const ACTIVE_COLOR = '#059669'
const RADIUS = 36

/** Afi's ground: brand deep, the one dark surface in the chrome. */
const ACTION_FILL = '#064e3b'

/** How far Afi steps down into the bar while his menu is up. */
const ACTION_SETTLE = 14

/** Icon size the layout declares its tab icons at. */
export const TAB_BAR_ICON_SIZE = 25

/** Inset of the capsule inside the pill, on every side. */
const CAPSULE_INSET = 5

/**
 * Which slot each page sits in, once Afi takes the middle one.
 *
 * Four pages, five slots, and the third belongs to nobody: the capsule has to
 * step over it. Written as a table rather than computed so the shape of the bar
 * is readable at a glance and a fifth tab cannot silently land on Afi.
 */
const SLOT_OF_PAGE = [0, 1, 3, 4]

/** Where Afi stands. */
const ACTION_SLOT = 2

const SLOT_COUNT = SLOT_OF_PAGE.length + 1

/** A bar rendered without Afi's slot has nothing to close. */
const noop = () => undefined

export function LiquidTabBar({
  state,
  descriptors,
  navigation,
  position,
  action,
}: TabBarRenderProps) {
  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const t = tokens[isDark ? 'dark' : 'light']
  const [trackWidth, setTrackWidth] = useState(0)
  const itemWidth = trackWidth / SLOT_COUNT
  const menuOpen = action?.open ?? false
  useAndroidBackCloses(menuOpen, action?.onClose ?? noop)
  const menuAnim = useMenuOpening(menuOpen)

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width)
  }

  /* Native-driven the whole way down: `position` comes off the pager's own
     scroll, and the interpolation never leaves that thread. Its output range
     is the slot table above, so during a swipe between the second and third
     page the capsule crosses Afi's slot in one continuous move rather than
     resting on him. */
  const capsuleShift = position
    ? position.interpolate({
        inputRange: SLOT_OF_PAGE.map((_, page) => page),
        outputRange: SLOT_OF_PAGE.map((slot) => slot * itemWidth),
        extrapolate: 'clamp',
      })
    : new Animated.Value((SLOT_OF_PAGE[state.index] ?? 0) * itemWidth)

  const slots: ReactNode[] = state.routes.map((route, index) => {
    const { options } = descriptors[route.key]
    const focused = state.index === index
    const label = options.title ?? route.name

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      })
      if (!focused && !event.defaultPrevented) {
        /* Only real switches: re-tapping the current tab and a press a screen
           swallowed are not movement, and counting them would turn the busiest
           control in the app into noise. The route name is a fixed key, never
           anything the person typed. */
        trackTap('tab_switch', { tab: route.name })
        navigation.navigate(route.name, route.params)
        if (process.env.EXPO_OS === 'ios') void Haptics.selectionAsync()
      }
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityLabel={options.tabBarAccessibilityLabel}
        accessibilityState={{ selected: focused }}
        testID={options.tabBarButtonTestID}
        onPress={onPress}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        style={{ zIndex: 1, flex: 1 }}
      >
        <TabItem
          index={index}
          focused={focused}
          position={position}
          activeColor={ACTIVE_COLOR}
          restColor={t.ink}
          label={label}
          renderIcon={options.tabBarIcon}
        />
      </Pressable>
    )
  })

  /* The slot itself is empty space inside the pane; Afi is drawn over the bar
     rather than in it, because half of him is above its edge. */
  if (action) slots.splice(ACTION_SLOT, 0, <View key="afi-slot" style={{ flex: 1 }} />)

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        /* Open, this reaches the top of the window so the dimmer behind the
           menu covers the whole screen and a tap anywhere outside shuts it. */
        top: menuOpen ? 0 : undefined,
        justifyContent: 'flex-end',
        paddingHorizontal: 14,
        /* The raised half of Afi's button lives in this padding. Without it he
           would hang outside the container, where Android stops delivering
           touches, and the app's main action would be dead above its waist. */
        paddingTop: TAB_BAR_TOP_GAP + TAB_BAR_ACTION_RAISE,
        paddingBottom: Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET),
      }}
    >
      {menuOpen && action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menüyü kapat"
          onPress={action.onClose}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.35)' },
          ]}
        />
      ) : null}

      {menuOpen && action ? (
        <Animated.View
          className="rounded-3xl border border-line/60 bg-surface p-2"
          style={{
            /* Clear of Afi's raised head. He steps down as this opens, but the
               card must not depend on that: the middle column would otherwise
               sit behind him, and the middle column is a face. */
            marginBottom: TAB_BAR_ACTION_RAISE + 8,
            boxShadow: '0 12px 34px rgba(15, 23, 42, 0.22)',
            opacity: menuAnim,
            transform: [
              { translateY: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            ],
          }}
        >
          {action.menu}
        </Animated.View>
      ) : null}

      <View>
        <BarSurface isDark={isDark}>
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
                opacity: itemWidth === 0 ? 0 : 1,
                backgroundColor: capsuleFill(isDark),
                transform: [{ translateX: capsuleShift }],
              }}
            />
            {slots}
          </View>
        </BarSurface>

        {action ? <AfiActionButton action={action} opening={menuAnim} /> : null}
      </View>
    </View>
  )
}

/**
 * Afi, in the middle of the bar and half above it.
 *
 * Not a plus sign: the button is the assistant, and what it opens is a short
 * list of the things this app is for. He changes stance when the list is up,
 * which is the same language he speaks everywhere else in the app, and the
 * only signal here that the button is a toggle rather than a link.
 */
/**
 * 0 shut, 1 open, and the card and Afi both ride it.
 *
 * Deliberately a driven value rather than a Reanimated `entering` animation.
 * A layout animation that never gets to run leaves what it wraps at its hidden
 * first frame, and this app has shipped a mounted, invisible screen twice for
 * exactly that reason (see addfood/AddFoodFlow). A timing this component starts
 * itself either runs or is skipped outright, and skipping it lands on the open
 * state rather than on nothing, which is also what reduced motion asks for.
 */
function useMenuOpening(open: boolean): Animated.Value {
  const reduced = useReducedMotion()
  const value = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!open) {
      /* Shut instantly: the card unmounts with it, so there is no closing
         animation to play and a value left mid-flight would make the next
         opening start from a half-lit state. */
      value.setValue(0)
      return
    }
    if (reduced) {
      value.setValue(1)
      return
    }
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    })
    animation.start()
    return () => animation.stop()
  }, [open, reduced, value])

  return value
}

function useAndroidBackCloses(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    /* Without this, back leaves the tab entirely and takes the screen behind
       the menu with it. Registered only while the menu is up, so the handler
       registered last is the one that answers. */
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => subscription.remove()
  }, [onClose, open])
}

function AfiActionButton({
  action,
  opening,
}: {
  action: TabBarAction
  opening: Animated.Value
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Afi ile hızlı işlemler"
      accessibilityState={{ expanded: action.open }}
      onPress={() => {
        if (process.env.EXPO_OS === 'ios') void Haptics.selectionAsync()
        action.onToggle()
      }}
      style={{
        position: 'absolute',
        alignSelf: 'center',
        left: 0,
        right: 0,
        top: -TAB_BAR_ACTION_RAISE,
        height: TAB_BAR_ACTION_SIZE,
        alignItems: 'center',
      }}
    >
      {/* Afi settles down into the bar as his menu comes up, so the thing he
          opened has the room and he is not standing in front of it. */}
      <Animated.View
        style={{
          width: TAB_BAR_ACTION_SIZE,
          height: TAB_BAR_ACTION_SIZE,
          borderRadius: TAB_BAR_ACTION_SIZE / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: ACTION_FILL,
          boxShadow: '0 8px 20px rgba(2, 44, 34, 0.35)',
          transform: [
            {
              translateY: opening.interpolate({
                inputRange: [0, 1],
                outputRange: [0, ACTION_SETTLE],
              }),
            },
          ],
        }}
      >
        <AfiPose
          pose={action.open ? 'merak' : 'selam'}
          tone="dark"
          size={TAB_BAR_ACTION_SIZE - 8}
        />
      </Animated.View>
    </Pressable>
  )
}

/** The capsule reads as a highlight lifted off the glass behind it. */
function capsuleFill(isDark: boolean): string {
  return isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.58)'
}

/**
 * The pane the items sit on.
 *
 * Rounding has to be clipped here rather than on the children, because both
 * the blur view and the glass view fill their own bounds.
 */
function BarSurface({ isDark, children }: { isDark: boolean; children: ReactNode }) {
  const t = tokens[isDark ? 'dark' : 'light']
  const shape = {
    borderRadius: RADIUS,
    borderCurve: 'continuous',
    overflow: 'hidden',
  } as const

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
