import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const sheetUrl = new URL('../../apps/mobile/src/ui/Sheet.tsx', import.meta.url)
const bodySetupUrl = new URL(
  '../../apps/mobile/src/features/body/BodySetupSheet.tsx',
  import.meta.url,
)

describe('Sheet Android hardware back handling', () => {
  it('closes an open sheet and consumes the hardware back event', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    expect(source).toContain('BackHandler.addEventListener')
    expect(source).toContain("'hardwareBackPress'")
    expect(source).toMatch(/if \(!open\) return[\s\S]*handleSheetClose\(\)[\s\S]*return true/)
    expect(source).toContain('return () => subscription.remove()')
  })

  it('routes hardware back through the existing dismissal guard', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    expect(source).toMatch(
      /if \(open && !enablePanDownToClose\)[\s\S]*ref\.current\?\.expand\(\)[\s\S]*return/,
    )
  })

  it('keeps the step-by-step body setup fixed above the bottom navigation', async () => {
    const [sheet, bodySetup] = await Promise.all([
      readFile(sheetUrl, 'utf8'),
      readFile(bodySetupUrl, 'utf8'),
    ])

    expect(sheet).toContain('scrollable ? (')
    expect(sheet).toContain('<BottomSheetView')
    /* A ratio of the container, never dynamic sizing: a dynamically sized sheet
       inside a tab asks for more height than its container has and gets clipped
       at the top. The exact ratio may move with the step content; that it is
       pinned at all may not. */
    expect(bodySetup).toMatch(/heightRatio=\{0\.\d+\}/)
    expect(bodySetup).toContain('scrollable={false}')
  })
})

describe('sheets that cover the tab bar', () => {
  it('hosts them in a modal, with the gesture root inside it', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    /* A sheet normally lives inside its tab screen, so the tab bar stays lit
       under the backdrop and the sheet only gets the height above it. */
    expect(source).toContain('overTabBar')
    expect(source).toMatch(/<Modal[\s\S]{0,200}transparent/)
    // Without the gesture root inside, pan and backdrop taps die on Android.
    expect(source).toMatch(/<GestureHandlerRootView[\s\S]{0,900}\{sheet\}[\s\S]{0,80}<\/GestureHandlerRootView>/)

    /* A transparent full screen host with a sheet that failed to rise is a
       trap: nothing visible, nothing responding. A tap must always land. */
    expect(source).toMatch(/position: 'absolute'[\s\S]{0,120}\}\}\s*\/>\s*\{sheet\}/)
  })

  it('keeps the host mounted through the close animation', async () => {
    const source = await readFile(sheetUrl, 'utf8')
    /* Unmounting on the flag would make the sheet vanish instead of sliding
       out, which reads as a crash rather than a dismissal. */
    expect(source).toContain('visible={hosted}')
    expect(source).toContain('CLOSE_ANIMATION_MS')
  })

  it('puts the long setup flow over the bar', async () => {
    const setup = await readFile(bodySetupUrl, 'utf8')
    expect(setup).toContain('overTabBar')
  })
})

describe('keyboard after an input is done with', () => {
  it('closes it whenever a sheet closes, in one place', async () => {
    const source = await readFile(sheetUrl, 'utf8')

    /* Leaving it up outlives the thing that asked for it and covers whatever
       comes next, which is how a celebration ended up behind a number pad. */
    expect(source).toContain("import { BackHandler, Keyboard, Modal, Pressable, View } from 'react-native'")
    expect(source).toMatch(/ref\.current\?\.close\(\)\s*[\s\S]{0,400}?Keyboard\.dismiss\(\)/)
  })

  it('closes it when a food is saved, on both save paths', async () => {
    const flow = await readFile(
      new URL('../../apps/mobile/src/features/nutrition/addfood/useAddFoodFlow.ts', import.meta.url),
      'utf8',
    )
    // Dismissed before the branch, so "save and add another" is covered too.
    expect(flow).toMatch(/Keyboard\.dismiss\(\)\s*if \(andAnother\)/)
  })
})
