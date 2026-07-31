import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const sheetPath = new URL('../../apps/mobile/src/ui/Sheet.tsx', import.meta.url)
const read = () => readFile(sheetPath, 'utf8')

/**
 * A sheet that was dismissed reopened itself a second or two later.
 *
 * `index={-1}` is not a detent. gorhom resolves the prop through its snap
 * list, finds no entry, and settles on the nearest one instead, which is the
 * open one. Closing is therefore done imperatively, but that call only ran
 * when `open` changed, so a shut sheet that resolved its own way back up on
 * the next re-render had nothing watching for it. On Bugün a re-render is
 * never more than a moment away, which is why the popup came back on its own
 * shortly after "Kapat".
 *
 * Two things keep it down, and both are asserted here because either one
 * disappearing brings the bug back.
 */
describe('a dismissed sheet stays dismissed', () => {
  it('pushes the sheet back down if it settles open while shut', async () => {
    const source = await read()

    // The settle handler has to look at whether the sheet is supposed to be
    // open, and close it again when it is not.
    expect(source).toMatch(/if \(!openRef\.current\) ref\.current\?\.close\(\)/)
  })

  /**
   * The other half: a closed sheet must hold nothing.
   *
   * The frozen content was kept for good, so everything inside a dismissed
   * sheet went on living: the add-food step alone holds two debounce timers, a
   * keyboard listener and a live query. Each of them re-renders the sheet, and
   * re-rendering the sheet is what let the index resolve its way back open.
   * Content is needed only while the closing animation plays.
   */
  it('drops its content once the closing animation has finished', async () => {
    const source = await read()

    expect(source).toContain('const renderedContent = !open && settledShut ? null : lastContent.current')
    expect(source).toContain('setSettledShut(true)')
  })

  // Written from an effect, never during render: a ref assigned while
  // rendering is both a lint error here and a lie when React discards the render.
  it('tracks the open flag without writing a ref during render', async () => {
    const source = await read()

    // Assigned straight after the declaration is the render-time form; the
    // line inside the effect reads the same, so the check has to be anchored.
    expect(source).not.toMatch(/const openRef = useRef\(open\)\s*\n\s*openRef\.current = open/)
    expect(source).toMatch(/useEffect\(\(\) => \{\s*openRef\.current = open/)
  })
})
