import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { AppState } from 'react-native'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

/**
 * When looping decoration is allowed to run.
 *
 * Everything in this app that loops forever (Afi breathing, the rhythm pulse,
 * the skeleton shimmer) keeps the device drawing sixty times a second for as
 * long as it is mounted, and a phone can only cool down once the drawing
 * stops. Mounted is not the same as visible: a tab screen stays mounted after
 * you leave it, so without a gate the cost of every tab a person has ever
 * opened is paid for the rest of the session.
 *
 * Three things close the gate:
 *  - the app is not frontmost. Only a fully backgrounded app is suspended by
 *    the system; the inactive window (control centre, the app switcher, an
 *    incoming call) keeps running, and that is exactly where an animation
 *    nobody can see costs the most.
 *  - the subtree sits on a screen the person is not looking at, which screens
 *    declare with `ScreenMotion`.
 *  - the system reduce-motion setting is on. That is a brand rule here as
 *    much as an accessibility one (maskot/README.md).
 */

/**
 * Whether this subtree is on screen.
 *
 * Defaults to true so anything rendered outside a screen (the celebrations
 * mounted at the app root, sheets, the error boundary) keeps animating without
 * having to know this exists. Only screens that can be left behind opt in.
 */
const ScreenMotionContext = createContext(true)

/** Marks a screen's subtree, so its loops rest while the screen is not shown. */
export function ScreenMotion({ active, children }: { active: boolean; children: ReactNode }) {
  return <ScreenMotionContext.Provider value={active}>{children}</ScreenMotionContext.Provider>
}

/**
 * One subscription for the whole app, not one per animated thing.
 *
 * The mascot gallery alone puts a dozen mascots on screen at once, and every
 * one of them asks this question; a listener each would be a dozen answers to
 * keep in step for a fact that is global anyway.
 */
function subscribeToAppState(onChange: () => void): () => void {
  const subscription = AppState.addEventListener('change', onChange)
  return () => subscription.remove()
}

function appIsActive(): boolean {
  return AppState.currentState === 'active'
}

/** True while the app is frontmost. */
function useAppActive(): boolean {
  return useSyncExternalStore(subscribeToAppState, appIsActive, appIsActive)
}

/**
 * True when a loop in this subtree should be running at all.
 *
 * Read this for anything that repeats forever, including plain JS timers: a
 * five second interval that only swaps a line of text still wakes the whole
 * React tree on a screen nobody is looking at.
 */
export function useMotionActive(): boolean {
  const onScreen = useContext(ScreenMotionContext)
  const appActive = useAppActive()
  const reduced = useReducedMotion()
  return onScreen && appActive && !reduced
}

/**
 * A scale that breathes between 1 and `to`, and rests at exactly 1 whenever
 * the gate is closed.
 *
 * Resting is a real stop (`cancelAnimation`) rather than a paused animation,
 * because a paused loop still holds its frame callback open. Coming back to
 * rest is itself animated so a pulse that stops mid-breath does not snap.
 */
export function useBreathingScale(to: number, durationMs: number) {
  const active = useMotionActive()
  const scale = useSharedValue(1)

  useEffect(() => {
    if (!active) {
      cancelAnimation(scale)
      scale.value = withTiming(1, { duration: 160 })
      return
    }
    /* A reversing repeat bounces between wherever it started and its target,
       so it has to start from exactly 1. Waking up while the settle above was
       still in flight would otherwise pin the pulse to a smaller swing for
       the rest of its life. */
    cancelAnimation(scale)
    scale.value = 1
    scale.value = withRepeat(
      withTiming(to, { duration: durationMs, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
    return () => cancelAnimation(scale)
  }, [active, to, durationMs, scale])

  return useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
}
