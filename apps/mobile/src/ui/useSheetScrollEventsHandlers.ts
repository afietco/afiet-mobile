import {
  useScrollEventsHandlersDefault,
  type ScrollEventsHandlersHookType,
} from '@gorhom/bottom-sheet'
import { useMemo } from 'react'
import { useSharedValue } from 'react-native-reanimated'
import { guardReentrantScroll } from './sheetScrollGuard'

/**
 * Drop-in replacement for `@gorhom/bottom-sheet`'s default scroll events hook
 * that cannot recurse into itself.
 *
 * The library's own worklets are reused verbatim; every one of them is only
 * wrapped in a shared re-entrancy flag so the synchronous scroll event produced
 * by `scrollTo` on the New Architecture is dropped instead of restarting the
 * handler. See `sheetScrollGuard.ts` for the crash this prevents.
 *
 * A single flag is shared across the handlers on purpose: `handleOnEndDrag` and
 * `handleOnMomentumEnd` call `scrollTo` too, and their echo arrives as an
 * `onScroll` event, so the guard has to span handler boundaries.
 */
export const useSheetScrollEventsHandlers: ScrollEventsHandlersHookType = (
  scrollableRef,
  scrollableContentOffsetY,
) => {
  const isDispatchingScrollCommand = useSharedValue(false)
  const { handleOnScroll, handleOnBeginDrag, handleOnEndDrag, handleOnMomentumBegin, handleOnMomentumEnd } =
    useScrollEventsHandlersDefault(scrollableRef, scrollableContentOffsetY)

  // Kept referentially stable: `useScrollHandler` feeds these straight into
  // `useAnimatedScrollHandler`'s dependency list.
  return useMemo(
    () => ({
      handleOnScroll: guardReentrantScroll(isDispatchingScrollCommand, handleOnScroll),
      handleOnBeginDrag: guardReentrantScroll(isDispatchingScrollCommand, handleOnBeginDrag),
      handleOnEndDrag: guardReentrantScroll(isDispatchingScrollCommand, handleOnEndDrag),
      handleOnMomentumBegin: guardReentrantScroll(isDispatchingScrollCommand, handleOnMomentumBegin),
      handleOnMomentumEnd: guardReentrantScroll(isDispatchingScrollCommand, handleOnMomentumEnd),
    }),
    [
      isDispatchingScrollCommand,
      handleOnScroll,
      handleOnBeginDrag,
      handleOnEndDrag,
      handleOnMomentumBegin,
      handleOnMomentumEnd,
    ],
  )
}
