import { readFile } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import { guardReentrantScroll, type MutableFlag } from '@/ui/sheetScrollGuard'

const sheetUrl = new URL('../../apps/mobile/src/ui/Sheet.tsx', import.meta.url)
const handlersUrl = new URL(
  '../../apps/mobile/src/ui/useSheetScrollEventsHandlers.ts',
  import.meta.url,
)

type ScrollEvent = { contentOffset: { y: number } }
type ScrollContext = { shouldLockInitialPosition: boolean }

const flag = (): MutableFlag => ({ value: false })
const event = (y: number): ScrollEvent => ({ contentOffset: { y } })
const context = (): ScrollContext => ({ shouldLockInitialPosition: false })

describe('bottom sheet scroll re-entrancy guard', () => {
  it('confirms the unguarded library pattern blows the stack', () => {
    // Control case: the shape of `useScrollEventsHandlersDefault` without the
    // guard. This is the crash Sentry reported, reproduced in isolation.
    const lockScrollable = (e: ScrollEvent, c: ScrollContext) => {
      lockScrollable(event(0), c)
    }

    expect(() => lockScrollable(event(120), context())).toThrow(RangeError)
  })

  it('drops the scroll event that the locked sheet dispatches to itself', () => {
    // Reproduces the production crash: while the scrollable is locked the sheet
    // pins it with `scrollTo`, which synchronously emits another scroll event on
    // the UI thread. Unguarded, the handler chain never unwinds.
    const isDispatching = flag()
    let offsetY = 120
    let guarded: (e: ScrollEvent, c: ScrollContext) => void

    const scrollTo = (y: number) => {
      offsetY = y
      // The New Architecture dispatches the command synchronously, so the
      // resulting scroll event lands before `scrollTo` returns.
      guarded(event(y), context())
    }
    const lockScrollable = vi.fn((_e: ScrollEvent, _c: ScrollContext) => {
      scrollTo(0)
    })
    guarded = guardReentrantScroll(isDispatching, lockScrollable)

    expect(() => guarded(event(offsetY), context())).not.toThrow()
    expect(lockScrollable).toHaveBeenCalledTimes(1)
    expect(offsetY).toBe(0)
    expect(isDispatching.value).toBe(false)
  })

  it('survives a lock position the scrollable never settles on', () => {
    // iOS rubber banding can keep reporting an offset that differs from the lock
    // position, so an "are we there yet" check alone would still recurse.
    const isDispatching = flag()
    let calls = 0
    let guarded: (e: ScrollEvent, c: ScrollContext) => void

    const bouncingLock = vi.fn((_e: ScrollEvent, _c: ScrollContext) => {
      calls += 1
      if (calls > 5000) throw new Error('runaway recursion')
      guarded(event(-40 - calls), context())
    })
    guarded = guardReentrantScroll(isDispatching, bouncingLock)

    expect(() => guarded(event(-40), context())).not.toThrow()
    expect(bouncingLock).toHaveBeenCalledTimes(1)
  })

  it('keeps handling genuine scroll events after the echo is dropped', () => {
    const isDispatching = flag()
    const seen: number[] = []
    let guarded: (e: ScrollEvent, c: ScrollContext) => void

    const lockScrollable = (e: ScrollEvent, _c: ScrollContext) => {
      seen.push(e.contentOffset.y)
      guarded(event(0), context())
    }
    guarded = guardReentrantScroll(isDispatching, lockScrollable)

    guarded(event(10), context())
    guarded(event(20), context())
    guarded(event(30), context())

    expect(seen).toEqual([10, 20, 30])
  })

  it('shares one flag across handlers so an end-drag echo is dropped too', () => {
    // `handleOnEndDrag` and `handleOnMomentumEnd` also call `scrollTo`; their
    // echo arrives as an `onScroll` event, so the guard has to span handlers.
    const isDispatching = flag()
    const onScroll = vi.fn()
    const guardedOnScroll = guardReentrantScroll(isDispatching, onScroll)
    const guardedOnEndDrag = guardReentrantScroll(isDispatching, () => {
      guardedOnScroll(event(0), context())
    })

    guardedOnEndDrag(event(64), context())

    expect(onScroll).not.toHaveBeenCalled()

    // A later, genuine scroll event is still delivered.
    guardedOnScroll(event(64), context())
    expect(onScroll).toHaveBeenCalledTimes(1)
  })

  it('releases the flag when the wrapped handler throws', () => {
    const isDispatching = flag()
    const failing = guardReentrantScroll(isDispatching, () => {
      throw new Error('worklet blew up')
    })

    expect(() => failing(event(0), context())).toThrow('worklet blew up')
    expect(isDispatching.value).toBe(false)
  })

  it('is a no-op when the library does not provide a handler', () => {
    const isDispatching = flag()
    const guarded = guardReentrantScroll<ScrollEvent, ScrollContext>(isDispatching, undefined)

    expect(() => guarded(event(0), context())).not.toThrow()
    expect(isDispatching.value).toBe(false)
  })
})

describe('bottom sheet scroll guard wiring', () => {
  it('installs the guarded hook on the sheet scrollable', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    expect(source).toContain("import { useSheetScrollEventsHandlers } from './useSheetScrollEventsHandlers'")
    expect(source).toContain('scrollEventsHandlersHook={useSheetScrollEventsHandlers}')
  })

  it('reuses the library worklets instead of reimplementing the lock behaviour', async () => {
    const source = await readFile(handlersUrl, 'utf8')

    expect(source).toContain('useScrollEventsHandlersDefault')
    for (const handler of [
      'handleOnScroll',
      'handleOnBeginDrag',
      'handleOnEndDrag',
      'handleOnMomentumBegin',
      'handleOnMomentumEnd',
    ]) {
      expect(source).toContain(`${handler}: guardReentrantScroll(isDispatchingScrollCommand, ${handler})`)
    }
  })
})
