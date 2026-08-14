import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * One assistant, one screen.
 *
 * An unknown food used to have two answers with two different Afis behind them:
 * the camera opened the photo assistant, while "Afi'ye anlat" walked to a
 * details step that stayed locked until a name AND a short description were
 * typed, then posted them to a separate suggestion agent. The describe door now
 * opens the same screen, which already accepts a text-only turn.
 */
const screen = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/AfiPhotoSheet.tsx', import.meta.url),
  'utf8',
)

const flow = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/useAddFoodFlow.ts', import.meta.url),
  'utf8',
)

const details = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/FoodDetailsStep.tsx', import.meta.url),
  'utf8',
)

describe('the describe door', () => {
  it('sends an unknown food to the Afi screen rather than to a second agent', () => {
    expect(flow).toContain("setPhotoIntent('describe')")
    expect(flow).toContain('setPhotoOpen(true)')
    expect(flow).not.toContain("origin: 'bookmark'")
    expect(details).not.toContain('requestAfiFill')
  })

  it('greets somebody who came to describe with an invitation to describe', () => {
    expect(screen).toContain("if (intent === 'describe')")
    expect(screen).toContain('birkaç kelimeyle anlat')
    // The photo route is still open from there; the doors are not exclusive.
    expect(screen).toContain('istersen fotoğrafını da çek')
  })

  it('changes only the greeting: the turn, the agent and the write are one', () => {
    expect(screen.match(/photoTurn\(/g) ?? []).toHaveLength(1)
    expect(screen).toContain('const runTurn = async (input: { text?: string; imageBase64?: string })')
  })

  it('closes the wizard behind it, so shutting Afi means done', () => {
    expect(flow).toContain('const closePhoto = useCallback(() => {\n    setPhotoOpen(false)\n    closeRef.current()')
  })
})

describe('the empty Afi screen', () => {
  it('offers the two ways in as cards, not just as icons in the bar', () => {
    expect(screen).toContain('Fotoğrafını çek')
    expect(screen).toContain('Tabağı gösteren bir kare yeter')
    expect(screen).toContain('Galeriden seç')
    expect(screen).toContain('Daha önce çektiğin bir kare')
  })

  it('gives the camera the solid card and the gallery the quiet one', () => {
    const camera = screen.indexOf('Tabağı gösteren bir kare yeter')
    const gallery = screen.indexOf('Daha önce çektiğin bir kare')

    expect(camera).toBeGreaterThan(-1)
    expect(gallery).toBeGreaterThan(camera)
    expect(screen).toContain('bg-emerald-600 px-4 py-3.5')
    expect(screen).toContain('border border-line bg-surface px-4 py-3.5')
  })

  it('shows them only while the conversation has not started', () => {
    // `atStart` is already the screen's word for "only the greeting is up".
    expect(screen).toContain('const atStart = messages.length <= 1')
    expect(screen.match(/\{atStart \? \(/g) ?? []).toHaveLength(2)
  })

  it('keeps the input bar, which is where they belong once talking begins', () => {
    expect(screen).toContain('ya da yaz…')
    /* Four callers: the empty-screen card, the bar button, the "yakından çek"
       quick reply, and the retry after a permission prompt. */
    expect(screen.match(/void takePhoto\(\)/g) ?? []).toHaveLength(4)
  })
})
