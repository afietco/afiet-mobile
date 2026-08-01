import type { KeseState } from '@afiet/core'
import { useSyncExternalStore } from 'react'
import { cycleKeseMock, keseMockSnapshot, spendKeseMock, subscribeKeseMock } from './mock'

/**
 * The weekly kese, as the screens see it.
 *
 * Everything below reads from the mock for now. When GET /v1/kese lands this
 * file swaps its body for the live query and `mock.ts` is deleted; nothing
 * else in the app knows where the numbers came from.
 */
export function useKese(): KeseState {
  return useSyncExternalStore(subscribeKeseMock, keseMockSnapshot, keseMockSnapshot)
}

/** Spends one kese. Temporary: the server derives this from the chat calls. */
export function spendKese(): void {
  spendKeseMock()
}

/**
 * Mock-only scenario switch, wired to a long press on the chip.
 *
 * Returns the label of the state now on screen, or null once the mock is gone,
 * which is what makes the long press quietly stop doing anything.
 */
export function cycleKeseScenario(): string | null {
  if (!__DEV__) return null
  return cycleKeseMock().label
}
