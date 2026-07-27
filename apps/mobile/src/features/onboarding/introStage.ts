/**
 * Geometry for the introduction pager.
 *
 * The scene animations run as worklets on the UI thread, so the arithmetic
 * lives here: it stays readable, it is shared by the pager and the indicator,
 * and it can be unit tested without a renderer.
 */

/** Afi never shrinks below this, however short the phone is. */
export const AFI_MIN = 112
/** Afi never grows past this, however large the screen is. */
export const AFI_MAX = 220
/** The aura box around Afi; the glow needs room to fall off to nothing. */
export const AURA_SCALE = 1.45

/**
 * Distance of a page from the centre of the viewport, in pages: 0 while the
 * page is centred, -1 when it is one page to the right of the offset, +1 when
 * it is one page to the left.
 *
 * Width is 0 for the first frame after a cold start on some devices, and
 * dividing by it would feed Infinity into `interpolate` and blank the scene, so
 * a zero width simply reports every page as centred.
 */
export function pageOffset(scrollX: number, width: number, index: number): number {
  'worklet'
  if (width <= 0) return 0
  return scrollX / width - index
}

/** Index of the page currently claiming the viewport, clamped to the deck. */
export function pageAt(scrollX: number, width: number, count: number): number {
  'worklet'
  if (width <= 0 || count <= 0) return 0
  return Math.min(count - 1, Math.max(0, Math.round(scrollX / width)))
}

/**
 * Afi is the hero of every scene, but the copy underneath has to stay on
 * screen: the mascot is sized off both edges of the window and then clamped.
 * The scene still scrolls when it cannot fit, which is what saves it once the
 * accessibility text size grows the copy past any budget we could reserve.
 */
export function introAfiSize(width: number, height: number): number {
  return Math.round(Math.max(AFI_MIN, Math.min(width * 0.62, height * 0.25, AFI_MAX)))
}

/**
 * Whether a scene has room for its proof pills.
 *
 * On a short phone the pills fall past the fold; the scene still scrolls to
 * them, but a row that is always half hidden reads as a layout bug. They are
 * supporting detail, so the short screens simply go without.
 */
export function introShowsMarks(height: number): boolean {
  return height >= 700
}
