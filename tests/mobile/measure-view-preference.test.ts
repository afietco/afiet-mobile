import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_MEASURE_VIEW,
  MEASURE_VIEW_KEY,
  loadMeasureView,
  measureView,
  parseMeasureView,
  setMeasureView,
} from '../../apps/mobile/src/features/nutrition/measureViewPreference'

/**
 * The remembered half of the "Günün ölçüsü" toggle.
 *
 * Two promises are worth guarding: someone who has never chosen sees the hand
 * measures (docs/hedeflerim.md section 12), and someone who did choose is not
 * asked again on the next launch.
 */

const memory = vi.hoisted(() => new Map<string, string>())

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => memory.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      memory.set(key, value)
    },
  },
}))

beforeEach(async () => {
  memory.clear()
  await loadMeasureView()
})

describe('measure view preference', () => {
  it('keeps the web key convention', () => {
    expect(MEASURE_VIEW_KEY).toBe('fh:measureView')
  })

  it('starts on the hand measures for someone who has never chosen', () => {
    expect(DEFAULT_MEASURE_VIEW).toBe('hand')
    expect(measureView()).toBe('hand')
  })

  it('falls back to the hand measures rather than to an empty card', () => {
    expect(parseMeasureView(null)).toBe('hand')
    expect(parseMeasureView('')).toBe('hand')
    expect(parseMeasureView('gram')).toBe('hand')
    expect(parseMeasureView('numbers')).toBe('numbers')
    expect(parseMeasureView('hand')).toBe('hand')
  })

  it('applies the choice immediately, without waiting for storage', () => {
    setMeasureView('numbers')
    expect(measureView()).toBe('numbers')
  })

  it('remembers the choice across a launch', async () => {
    setMeasureView('numbers')
    // Let the fire and forget write settle, then start from cold storage.
    await Promise.resolve()
    expect(memory.get(MEASURE_VIEW_KEY)).toBe('numbers')

    await loadMeasureView()
    expect(measureView()).toBe('numbers')
  })

  it('returns to the hand measures when someone switches back', async () => {
    setMeasureView('numbers')
    setMeasureView('hand')
    await Promise.resolve()

    await loadMeasureView()
    expect(measureView()).toBe('hand')
  })

  it('hydrates behind the splash, with the other startup preferences', async () => {
    const source = await readFile(
      new URL('../../apps/mobile/src/app/_layout.tsx', import.meta.url),
      'utf8',
    )
    // Same batch the theme and the FTUE flags use: hydrating later would render
    // the default view first and flip it a frame after the splash lifted.
    expect(source).toMatch(
      /Promise\.all\(\[[\s\S]*?loadInitialTheme\(\),[\s\S]*?loadMeasureView\(\),?[\s\S]*?\]\)/,
    )
    expect(source).toContain('setStartupReady(true)')
  })
})
