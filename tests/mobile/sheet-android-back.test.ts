import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const sheetUrl = new URL('../../apps/mobile/src/ui/Sheet.tsx', import.meta.url)

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
})
