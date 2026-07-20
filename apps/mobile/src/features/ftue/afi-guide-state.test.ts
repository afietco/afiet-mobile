import { describe, expect, it } from 'vitest'
import { nextAfiGuideStep, shouldStartAfiGuide } from './afi-guide-state'

const NOW_MS = Date.parse('2026-07-20T12:00:00.000Z')

describe('Afi guide state', () => {
  it('selects the first incomplete task in order', () => {
    expect(
      nextAfiGuideStep({ mealDone: false, waterDone: false, measurementDone: false }),
    ).toBe('meal')
    expect(
      nextAfiGuideStep({ mealDone: true, waterDone: false, measurementDone: false }),
    ).toBe('water')
    expect(
      nextAfiGuideStep({ mealDone: true, waterDone: true, measurementDone: false }),
    ).toBe('body')
    expect(
      nextAfiGuideStep({ mealDone: true, waterDone: true, measurementDone: true }),
    ).toBe('complete')
  })

  it('starts for a new account or an unfinished legacy guide', () => {
    expect(
      shouldStartAfiGuide({
        profileCreatedAt: '2026-07-19T12:00:00.000Z',
        legacyGuideShown: false,
        legacyGuideDone: false,
        nowMs: NOW_MS,
      }),
    ).toBe(true)
    expect(
      shouldStartAfiGuide({
        profileCreatedAt: '2026-07-20 11:00:00.123456+00',
        legacyGuideShown: false,
        legacyGuideDone: false,
        nowMs: NOW_MS,
      }),
    ).toBe(true)
    expect(
      shouldStartAfiGuide({
        profileCreatedAt: '2025-01-01T00:00:00.000Z',
        legacyGuideShown: true,
        legacyGuideDone: false,
        nowMs: NOW_MS,
      }),
    ).toBe(true)
  })

  it('does not restart a completed guide or interrupt an established account', () => {
    expect(
      shouldStartAfiGuide({
        profileCreatedAt: '2026-07-20T11:00:00.000Z',
        legacyGuideShown: true,
        legacyGuideDone: true,
        nowMs: NOW_MS,
      }),
    ).toBe(false)
    expect(
      shouldStartAfiGuide({
        profileCreatedAt: '2026-07-01T12:00:00.000Z',
        legacyGuideShown: false,
        legacyGuideDone: false,
        nowMs: NOW_MS,
      }),
    ).toBe(false)
  })
})
