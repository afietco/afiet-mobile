import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * Afi took the middle of the tab bar.
 *
 * Four tabs and no way to start anything: everything the app is actually for
 * began on a screen you had to reach first. The middle slot is now Afi himself,
 * half above the pane, and what he opens is a short list of the five things
 * people come here to do.
 */
const bar = readFileSync(
  new URL('../../apps/mobile/src/features/nav/LiquidTabBar.tsx', import.meta.url),
  'utf8',
)

const actions = readFileSync(
  new URL('../../apps/mobile/src/features/nav/QuickActions.tsx', import.meta.url),
  'utf8',
)

const space = readFileSync(
  new URL('../../apps/mobile/src/features/nav/tabBarSpace.ts', import.meta.url),
  'utf8',
)

const layout = readFileSync(
  new URL('../../apps/mobile/src/app/(tabs)/_layout.tsx', import.meta.url),
  'utf8',
)

describe('the Afi button', () => {
  it('is the mascot itself, not a plus sign', () => {
    expect(bar).toContain('<AfiPose')
    expect(bar).toContain('tone="dark"')
    expect(bar).not.toContain('IconPlus')
  })

  it('changes stance while its menu is up', () => {
    expect(bar).toContain("pose={action.open ? 'merak' : 'selam'}")
    expect(bar).toContain('accessibilityState={{ expanded: action.open }}')
  })

  it('is only pressable where the circle is', () => {
    /* Pinning left and right to zero on the Pressable made the touch target a
       full-width strip across the TOP of every tab: tapping the upper edge of
       Grubum opened Afi's menu instead of switching tab. The wrapper centres
       and passes touches through; only the circle takes them. */
    expect(bar).toContain('pointerEvents="box-none"')
    expect(bar).toMatch(/style=\{\{\s*width: TAB_BAR_ACTION_SIZE,\s*height: TAB_BAR_ACTION_SIZE,\s*\}\}/)
  })

  it('keeps its raised half inside the container that receives touches', () => {
    /* Android does not deliver a touch that lands outside the parent's bounds,
       so a button hanging over the top edge would be dead above its waist. */
    expect(bar).toContain('paddingTop: TAB_BAR_TOP_GAP + TAB_BAR_ACTION_RAISE')
    expect(bar).toContain('top: -TAB_BAR_ACTION_RAISE')
  })

  it('is reserved for by the screens scrolling underneath', () => {
    expect(space).toContain('TAB_BAR_ACTION_RAISE +')
  })

  it('leaves the four pages their own slots', () => {
    expect(bar).toContain('const SLOT_OF_PAGE = [0, 1, 3, 4]')
    expect(bar).toContain('const ACTION_SLOT = 2')
  })
})

describe('the quick action menu', () => {
  it('offers the two records and the three conversations', () => {
    expect(actions).toContain('Besin ekle')
    expect(actions).toContain('Ölçüm ekle')
    expect(actions).toContain('assistant="afi"')
    expect(actions).toContain('assistant="beslenme"')
    expect(actions).toContain('assistant="destek"')
  })

  it('shapes the two halves differently, because they are different questions', () => {
    // Errands are rows with a sentence; choosing who to talk to is three faces.
    expect(actions).toContain('<RecordRow')
    expect(actions).toContain('<AssistantColumn')
    expect(actions).toContain('<View className="flex-row">')
  })

  it('gives each record the colour its own section already wears', () => {
    expect(actions).toContain("emerald: { chip: 'bg-emerald-100 dark:bg-emerald-900/50'")
    expect(actions).toContain("violet: { chip: 'bg-violet-100 dark:bg-violet-900/50'")
  })

  it('lets the three faces carry the choice, with no description under them', () => {
    expect(actions).toContain('size={76}')
    expect(actions).not.toContain('spec.subtitle')
  })

  it('opens the records where you already stand, without changing tab', () => {
    expect(actions).toContain('onAddFood()')
    expect(actions).toContain('onAddMeasurement()')
    expect(actions).not.toContain("router.push('/(tabs)")
    expect(layout).toContain('<DeferredAddFoodSheet')
    expect(layout).toContain('<MeasurementSheet')
  })

  it('sends each conversation to its own assistant', () => {
    expect(actions).toContain('`/sohbet?asistan=${assistant}`')
  })

  it('says which two conversations afiet+ is for, in gold and without a lock', () => {
    expect(actions.match(/ premium onDone=/g) ?? []).toHaveLength(2)
    expect(actions).toContain('bg-amber-100')
    expect(actions).not.toContain('IconLock')
    expect(actions).not.toContain('disabled')
  })

  it('shuts itself before it goes anywhere', () => {
    // A menu still standing over the screen it just opened is the thing people
    // read as the app not having heard them.
    expect(actions.match(/onDone\(\)/g) ?? []).toHaveLength(3)
  })

  it('opens on a timing it starts itself, never a layout animation', () => {
    /* Twice now a Reanimated entering animation that did not run has left the
       thing it wrapped mounted at its hidden first frame. A driven value either
       runs or is skipped, and skipping lands on the open state. */
    expect(bar).not.toContain('entering=')
    expect(bar).toContain('function useMenuOpening')
    expect(bar).toContain('if (reduced) {\n      value.setValue(1)')
  })

  it('steps Afi down as the card comes up, so he is not in front of it', () => {
    expect(bar).toContain('const ACTION_SETTLE = 14')
    expect(bar).toContain('outputRange: [0, ACTION_SETTLE]')
    // And the card clears his raised head whatever the animation is doing.
    expect(bar).toContain('marginBottom: TAB_BAR_ACTION_RAISE + 8')
  })

  it('closes on a tap outside, which means the dimmer covers the window', () => {
    expect(bar).toContain('accessibilityLabel="Menüyü kapat"')
    expect(bar).toContain('onPress={action.onClose}')
    // The bar's container only spans its own height until the menu is up.
    expect(bar).toContain('top: menuOpen ? 0 : undefined')
  })

  it('closes on Android back rather than leaving the tab', () => {
    expect(bar).toContain("BackHandler.addEventListener('hardwareBackPress'")
    expect(bar).toContain('useAndroidBackCloses(menuOpen')
  })
})
