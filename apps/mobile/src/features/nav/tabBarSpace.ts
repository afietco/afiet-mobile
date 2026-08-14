import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * The floating tab bar's geometry, in the one place that owns it.
 *
 * The bar stopped occupying layout space when it turned to glass: it hovers
 * over the scenes so there is something moving behind it to refract. That
 * means every scrolling screen now has to reserve the room itself, and they
 * all have to reserve the same room, or the last row of one screen sits under
 * the bar while another leaves a gap.
 */

/** Height of the pill itself. Elastic: the label may push it taller. */
export const TAB_BAR_TRACK_HEIGHT = 72

/** Gap between the pill and the content scrolling past above it. */
export const TAB_BAR_TOP_GAP = 7

/** Floor for the home-indicator inset, so the pill never hugs the edge. */
export const TAB_BAR_MIN_BOTTOM_INSET = 8

/** Diameter of Afi's button, sitting in the middle slot of the bar. */
export const TAB_BAR_ACTION_SIZE = 58

/**
 * How far that button stands above the pill's top edge.
 *
 * Half of it, which is the shape everybody already reads as "the main action".
 * The number is spent twice and must be: the bar's own container grows upward
 * by it, so the raised half is inside the container's bounds and Android still
 * delivers touches to it, and the space below reserves it, so nothing a screen
 * draws ends up under Afi.
 */
export const TAB_BAR_ACTION_RAISE = Math.round(TAB_BAR_ACTION_SIZE / 2)

/** Extra room so the last row clears the bar instead of touching it. */
const BREATHING_ROOM = 16

/** Bottom padding a scrolling tab screen needs to clear the floating bar. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets()
  return (
    TAB_BAR_TRACK_HEIGHT +
    TAB_BAR_TOP_GAP +
    TAB_BAR_ACTION_RAISE +
    Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET) +
    BREATHING_ROOM
  )
}
