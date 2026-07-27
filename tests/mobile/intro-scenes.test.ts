import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  AFI_MAX,
  AFI_MIN,
  introAfiSize,
  introShowsMarks,
  pageAt,
  pageOffset,
} from '@/features/onboarding/introStage'

const introUrl = new URL('../../apps/mobile/src/app/intro.tsx', import.meta.url)
const readIntro = () => readFile(introUrl, 'utf8')

describe('introduction pager geometry', () => {
  it('reports a centred page as zero and its neighbours as one page away', () => {
    expect(pageOffset(0, 390, 0)).toBe(0)
    expect(pageOffset(390, 390, 1)).toBe(0)
    expect(pageOffset(390, 390, 0)).toBe(1)
    expect(pageOffset(0, 390, 1)).toBe(-1)
    expect(pageOffset(195, 390, 0)).toBeCloseTo(0.5)
  })

  it('treats every page as centred before the window has been measured', () => {
    // useWindowDimensions reports 0 for a frame on some cold starts; dividing by
    // it would push Infinity into interpolate and blank the whole scene.
    expect(pageOffset(0, 0, 0)).toBe(0)
    expect(pageOffset(120, 0, 2)).toBe(0)
    expect(Number.isFinite(pageOffset(120, 0, 2))).toBe(true)
  })

  it('claims the next page at the halfway point and never leaves the deck', () => {
    expect(pageAt(0, 390, 3)).toBe(0)
    expect(pageAt(194, 390, 3)).toBe(0)
    expect(pageAt(196, 390, 3)).toBe(1)
    expect(pageAt(780, 390, 3)).toBe(2)
    // iOS rubber banding overscrolls past both ends.
    expect(pageAt(-90, 390, 3)).toBe(0)
    expect(pageAt(1400, 390, 3)).toBe(2)
    expect(pageAt(0, 0, 3)).toBe(0)
  })
})

describe('introduction mascot sizing', () => {
  it('keeps Afi readable on a small phone and calm on a large one', () => {
    // iPhone SE 1, iPhone SE 3, iPhone 15, iPhone 15 Pro Max, iPad-sized window.
    expect(introAfiSize(320, 568)).toBe(142)
    expect(introAfiSize(375, 667)).toBe(167)
    expect(introAfiSize(390, 844)).toBe(211)
    expect(introAfiSize(414, 896)).toBe(AFI_MAX)
    expect(introAfiSize(1024, 1366)).toBe(AFI_MAX)
  })

  it('drops the proof pills on a screen too short to show them whole', () => {
    expect(introShowsMarks(568)).toBe(false)
    expect(introShowsMarks(667)).toBe(false)
    expect(introShowsMarks(844)).toBe(true)
    expect(introShowsMarks(932)).toBe(true)
  })

  it('shrinks with the shorter edge so the copy keeps its room', () => {
    // A short, wide window is driven by height, not width.
    expect(introAfiSize(900, 500)).toBe(125)
    // And never past the floor, however cramped the window gets.
    expect(introAfiSize(900, 200)).toBe(AFI_MIN)
    expect(introAfiSize(120, 900)).toBe(AFI_MIN)
  })
})

describe('introduction scenes', () => {
  it('gives every page a mascot pose, an accent for both themes and copy', async () => {
    const source = await readIntro()

    for (const pose of ["pose: 'selam'", "pose: 'kasik'", "pose: 'aile'"]) {
      expect(source).toContain(pose)
    }
    for (const accent of [
      "accent: ['#059669', '#34d399']",
      "accent: ['#d97706', '#fbbf24']",
      "accent: ['#e11d48', '#fb7185']",
    ]) {
      expect(source).toContain(accent)
    }
    expect(source).toContain('<AfiPose')
    expect(source).toContain('afiLabel')
    // The generic icon-in-a-gradient-tile the mascot replaced.
    expect(source).not.toContain('IconBowl')
    expect(source).not.toContain('IconWheat')
  })

  it('drives the scenes from the pager offset, not from mount-time entrances', async () => {
    const source = await readIntro()

    expect(source).toContain('useAnimatedScrollHandler')
    expect(source).toContain('useAnimatedStyle')
    expect(source).toContain('scrollEventThrottle={16}')
    // Entering animations only play once, so a swipe back showed nothing.
    expect(source).not.toContain('FadeInDown')
    expect(source).not.toContain('ZoomIn')
  })

  it('tracks the active page from the offset so the button keeps up with the finger', async () => {
    const source = await readIntro()

    expect(source).toContain('useAnimatedReaction')
    expect(source).toContain('runOnJS(openPage)(index)')
    expect(source).toContain('pageAt(scrollX.value, width, PAGES.length)')
    expect(source).not.toContain('onMomentumScrollEnd')
  })

  it('never styles an animated wrapper through NativeWind class names', async () => {
    // An animated style silently wins over className on Animated components, so
    // the layout has to be written as style objects inside them.
    const source = await readIntro()
    const animatedTags = source.match(/<Animated\.[A-Za-z]+[^>]*>/gs) ?? []

    expect(animatedTags.length).toBeGreaterThan(0)
    for (const tag of animatedTags) {
      expect(tag).not.toContain('className=')
    }
  })

  it('keeps the introduction reachable for a screen reader', async () => {
    const source = await readIntro()

    expect(source).toContain('accessibilityLabel={page.afiLabel}')
    expect(source).toContain("accessibilityLabel=\"Tanıtımı atla\"")
    expect(source).toContain("'Tanıtımı bitir ve ilk kaydına geç'")
  })
})
