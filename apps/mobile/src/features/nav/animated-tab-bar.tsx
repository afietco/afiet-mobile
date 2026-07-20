import * as Haptics from 'expo-haptics'
import { Tabs } from 'expo-router'
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { Pressable, View, type LayoutChangeEvent } from 'react-native'
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

type ExpoTabsProps = ComponentProps<typeof Tabs>
type ExpoTabBarProps = Parameters<NonNullable<ExpoTabsProps['tabBar']>>[0]

interface AnimatedTabBarProps extends ExpoTabBarProps {
  locked: boolean
}

const ACTIVE_COLOR = '#059669'
const LOCKED_LIGHT = '#747884'
const LOCKED_DARK = '#020617'

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
  insets,
  locked,
}: AnimatedTabBarProps) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const [trackWidth, setTrackWidth] = useState(0)
  const selectedIndex = useSharedValue(state.index)
  const itemWidth = trackWidth / state.routes.length
  const lockedTint = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.58)'

  useEffect(() => {
    selectedIndex.value = withSpring(state.index, {
      damping: 20,
      stiffness: 230,
      mass: 0.75,
      reduceMotion: ReduceMotion.System,
    })
  }, [selectedIndex, state.index])

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: locked || itemWidth === 0 ? 0 : withTiming(1, { duration: 140 }),
    transform: [{ translateX: selectedIndex.value * itemWidth }],
    width: Math.max(0, itemWidth - 8),
  }))

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width)
  }

  return (
    <View
      accessibilityRole="tablist"
      style={{
        paddingHorizontal: 14,
        paddingTop: 7,
        paddingBottom: Math.max(insets.bottom, 8),
        backgroundColor: locked ? (isDark ? LOCKED_DARK : LOCKED_LIGHT) : t.canvas,
      }}
    >
      <View
        onLayout={handleLayout}
        style={{
          height: 72,
          flexDirection: 'row',
          paddingHorizontal: 4,
          borderRadius: 36,
          borderCurve: 'continuous',
          backgroundColor: locked ? (isDark ? LOCKED_DARK : LOCKED_LIGHT) : t.surface,
          boxShadow: locked ? undefined : '0 8px 28px rgba(15, 23, 42, 0.10)',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 4,
              top: 5,
              bottom: 5,
              borderRadius: 31,
              backgroundColor: isDark ? '#1e293b' : '#e7ecef',
            },
            indicatorStyle,
          ]}
        />

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]
          const focused = state.index === index
          const color = locked ? lockedTint : focused ? ACTIVE_COLOR : t.ink
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
              <AnimatedTabItem focused={focused}>
                {options.tabBarIcon?.({ focused, color, size: 25 })}
                <AppText
                  numberOfLines={1}
                  allowFontScaling
                  weight={focused ? 'bold' : 'semibold'}
                  style={{ color, fontSize: 12 }}
                >
                  {label}
                </AppText>
              </AnimatedTabItem>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function AnimatedTabItem({ focused, children }: { focused: boolean; children: ReactNode }) {
  const progress = useSharedValue(focused ? 1 : 0)

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 17,
      stiffness: 260,
      reduceMotion: ReduceMotion.System,
    })
  }, [focused, progress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -progress.value }, { scale: 1 + progress.value * 0.035 }],
  }))

  return (
    <Animated.View
      style={[
        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  )
}
