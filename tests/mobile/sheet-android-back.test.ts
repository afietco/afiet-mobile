import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const sheetUrl = new URL('../../apps/mobile/src/ui/Sheet.tsx', import.meta.url)
const overlayUrl = new URL('../../apps/mobile/src/ui/overlayHost.tsx', import.meta.url)
const rootLayoutUrl = new URL('../../apps/mobile/src/app/_layout.tsx', import.meta.url)
const bodySetupUrl = new URL(
  '../../apps/mobile/src/features/body/BodySetupSheet.tsx',
  import.meta.url,
)
const afiSceneUrl = new URL('../../apps/mobile/src/ui/maskot/AfiScene.tsx', import.meta.url)
const menuUrl = new URL('../../apps/mobile/src/features/nav/HamburgerMenu.tsx', import.meta.url)

describe('Android hardware back handling', () => {
  it('closes the popup in front and consumes the event', async () => {
    const source = await readFile(overlayUrl, 'utf8')

    expect(source).toContain('BackHandler.addEventListener')
    expect(source).toContain("'hardwareBackPress'")
    /* One handler for every popup, registered only while it is active, so the
       last one opened is the one that answers. */
    expect(source).toMatch(
      /if \(!active \|\| !onRequestClose\) return[\s\S]*onRequestClose\(\)[\s\S]*return true/,
    )
    expect(source).toContain('return () => subscription.remove()')
  })

  it('routes hardware back through the sheet dismissal guard', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    // The guard lives in handleSheetClose, and back is wired to exactly that.
    expect(source).toMatch(
      /if \(open && !enablePanDownToClose\)[\s\S]*ref\.current\?\.expand\(\)[\s\S]*return/,
    )
    expect(source).toContain('onRequestClose={handleSheetClose}')
  })

  it('gives every popup that hides the app a way back out', async () => {
    const [scene, menu] = await Promise.all([
      readFile(afiSceneUrl, 'utf8'),
      readFile(menuUrl, 'utf8'),
    ])

    /* These two used to get it from Modal's onRequestClose. Off the native
       modal, back would otherwise leave the route and take the screen behind
       the popup with it. */
    expect(scene).toContain('onRequestClose={onClose}')
    expect(menu).toContain('onRequestClose={onClose}')
  })

  it('keeps the step-by-step body setup fixed above the bottom navigation', async () => {
    const [sheet, bodySetup] = await Promise.all([
      readFile(sheetUrl, 'utf8'),
      readFile(bodySetupUrl, 'utf8'),
    ])

    expect(sheet).toContain('scrollable ? (')
    expect(sheet).toContain('<BottomSheetView')
    /* A ratio of the window, never dynamic sizing: the step content decides how
       tall it wants to be and the buttons pay for it. The exact ratio may move
       with the steps; that it is pinned at all may not. */
    expect(bodySetup).toMatch(/heightRatio=\{0\.\d+\}/)
    expect(bodySetup).toContain('scrollable={false}')
  })
})

describe('popups and the tab bar', () => {
  it('draws every popup in one layer above the navigator', async () => {
    const layout = await readFile(rootLayoutUrl, 'utf8')

    /* Mounted around the app, so entries render after the navigator and paint
       over the tab bar. Inside the providers, so a popup reads the same auth,
       theme and gestures as the screen that opened it. */
    expect(layout).toContain('<OverlayHost>')
    expect(layout.indexOf('<OverlayHost>')).toBeGreaterThan(layout.indexOf('<AuthProvider>'))
    expect(layout.indexOf('<OverlayHost>')).toBeLessThan(layout.indexOf('<Stack '))
  })

  it('leaves no sheet to decide it for itself', async () => {
    const [sheet, bodySetup] = await Promise.all([
      readFile(sheetUrl, 'utf8'),
      readFile(bodySetupUrl, 'utf8'),
    ])

    /* It was never a real choice. A sheet cut off at the tab bar, with a
       backdrop that leaves the bar lit and tappable, is wrong on every screen
       that has a bar, so clearing it is not something a call site opts into. */
    expect(sheet).not.toContain('overTabBar')
    expect(bodySetup).not.toContain('overTabBar')
    expect(sheet).toMatch(/<Overlay\s+active=\{open\}/)
  })

  it('keeps popups off the native modal, so two of them can coexist', async () => {
    const [sheet, scene, menu] = await Promise.all([
      readFile(sheetUrl, 'utf8'),
      readFile(afiSceneUrl, 'utf8'),
      readFile(menuUrl, 'utf8'),
    ])

    /* iOS presents a modal on the nearest view controller with no queue and no
       check: two as siblings mean the second is silently refused and never
       appears. A celebration over an open sheet is exactly that pair. */
    for (const source of [sheet, scene, menu]) {
      expect(source).not.toContain('<Modal')
    }
  })

  it('brings the popup that just opened to the front', async () => {
    const source = await readFile(overlayUrl, 'utf8')

    /* Mount order is not open order: the public-profile sheet is mounted at app
       start and can be opened from a sheet belonging to a much later screen. */
    expect(source).toMatch(/if \(active\) host\?\.raise\(key\)/)
  })

  it('closes a sheet whose screen has been left behind', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    /* It used to be clipped inside the screen that opened it, so a screen left
       behind took its sheet with it. From the overlay layer it would stay up
       over whatever came next. */
    expect(source).toContain('usePathname')
    expect(source).toMatch(/if \(left && open\) onClose\(\)/)
  })
})

describe('keyboard after an input is done with', () => {
  it('closes it whenever a sheet closes, in one place', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    /* Leaving it up outlives the thing that asked for it and covers whatever
       comes next, which is how a celebration ended up behind a number pad. */
    expect(source).toMatch(/import \{[^}]*\bKeyboard\b[^}]*\} from 'react-native'/)
    expect(source).toMatch(/ref\.current\?\.close\(\)\s*[\s\S]{0,400}?Keyboard\.dismiss\(\)/)
  })

  it('closes it when a food is saved, whichever way the save ends', async () => {
    const flow = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/addfood/useAddFoodFlow.ts', import.meta.url),
      'utf8',
    )

    /* Dismissed before the branching, so every ending is covered: closing the
       sheet, staying open for another food, and taking the next food of a
       sentence. Asserted by position rather than by adjacency, because a new
       ending must not be able to slip in ahead of the dismissal. */
    const dismissedAt = flow.indexOf('Keyboard.dismiss()')
    expect(dismissedAt).toBeGreaterThan(-1)
    for (const branch of ['const [queued, ...rest] = queueRef.current', 'if (andAnother) {']) {
      expect(flow.indexOf(branch), branch).toBeGreaterThan(dismissedAt)
    }
  })
})
