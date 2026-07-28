import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'

/**
 * Which language the "Günün ölçüsü" card speaks, remembered across launches.
 *
 * Hand measures are the product's own language, so they are what someone who
 * has never chosen sees (docs/hedeflerim.md section 12). The grams and calories
 * are never denied, they are simply not the default.
 *
 * The store is module level and read once at startup behind the splash, the
 * same shape `useTheme` uses: a per-instance copy would let the card render the
 * default first and flip to the remembered view a frame later.
 */

export type MeasureView = 'hand' | 'numbers'

/** Preference keys keep the web `fh:` prefix (BRAND.md, application identity). */
export const MEASURE_VIEW_KEY = 'fh:measureView'

export const DEFAULT_MEASURE_VIEW: MeasureView = 'hand'

let current: MeasureView = DEFAULT_MEASURE_VIEW
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

/** Anything unreadable falls back to the default rather than to an empty card. */
export function parseMeasureView(raw: string | null): MeasureView {
  return raw === 'hand' || raw === 'numbers' ? raw : DEFAULT_MEASURE_VIEW
}

/** Called by the root layout before the splash is hidden. */
export async function loadMeasureView(): Promise<void> {
  let raw: string | null = null
  try {
    raw = await AsyncStorage.getItem(MEASURE_VIEW_KEY)
  } catch {
    // An unreadable preference is not worth a failed startup; the default holds.
  }
  current = parseMeasureView(raw)
  emit()
}

export function measureView(): MeasureView {
  return current
}

/**
 * Applied in memory first so the switch is instant; the write is fire and
 * forget, because a preference that fails to persist is a smaller problem than
 * a toggle that waits for storage.
 */
export function setMeasureView(next: MeasureView): void {
  if (next === current) return
  current = next
  emit()
  void AsyncStorage.setItem(MEASURE_VIEW_KEY, next).catch(() => undefined)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export interface MeasureViewState {
  view: MeasureView
  /** Stable module function, so a memoized toggle never re-renders for it. */
  setView: (next: MeasureView) => void
}

export function useMeasureView(): MeasureViewState {
  const view = useSyncExternalStore(subscribe, measureView)
  return { view, setView: setMeasureView }
}
