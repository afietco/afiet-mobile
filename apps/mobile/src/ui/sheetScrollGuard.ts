/**
 * Re-entrancy guard for the bottom sheet scroll worklets.
 *
 * `@gorhom/bottom-sheet` keeps a *locked* scrollable pinned in place by calling
 * Reanimated's `scrollTo` from inside its own scroll worklet. On the New
 * Architecture `scrollTo` lowers to a synchronous `dispatchCommand` on the UI
 * thread, so the scroll view emits the resulting scroll event *before*
 * `scrollTo` returns and the worklet re-enters itself:
 *
 *   handleOnScroll -> scrollTo -> dispatchCommand -> handleEvent -> handleOnScroll -> ...
 *
 * Nothing in that chain converges, so the UI runtime dies with
 * `RangeError: Maximum call stack size exceeded (native stack depth)`
 * (observed in production on iOS 18.5, release 0.7.1+34).
 *
 * The guard makes the sheet ignore the scroll events it caused itself: the
 * first entry claims the flag, the synchronous re-entry sees it set and returns
 * immediately. Real scroll events always arrive with the flag cleared, so the
 * library's locking behaviour is preserved; only the self-inflicted echo is
 * dropped.
 *
 * This module is intentionally free of react-native imports so the guard can be
 * unit tested on plain Node.
 */

/** Minimal mutable container; Reanimated's `SharedValue<boolean>` satisfies it. */
export interface MutableFlag {
  value: boolean
}

export type ScrollWorklet<E, C> = (event: E, context: C) => void

/**
 * Wraps a scroll worklet so that events dispatched from within the worklet
 * itself are ignored. Returns a no-op wrapper when `handler` is undefined,
 * which keeps the returned handler map shape stable for the library.
 */
export function guardReentrantScroll<E, C>(
  isDispatching: MutableFlag,
  handler: ScrollWorklet<E, C> | undefined,
): ScrollWorklet<E, C> {
  return (event, context) => {
    'worklet'
    if (isDispatching.value) return
    if (!handler) return

    isDispatching.value = true
    try {
      handler(event, context)
    } finally {
      isDispatching.value = false
    }
  }
}
