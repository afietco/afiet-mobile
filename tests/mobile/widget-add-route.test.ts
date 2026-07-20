import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const routePath = fileURLToPath(
  new URL('../../apps/mobile/src/app/ekle.tsx', import.meta.url),
)

describe('widget add route', () => {
  it('writes the pending meal after render and redirects only from the effect', async () => {
    const source = await readFile(routePath, 'utf8')
    const effectStart = source.indexOf('useEffect(() => {')
    const bridgeWrite = source.indexOf('setPendingAdd(rawMeal)')
    const redirect = source.indexOf("router.replace('/(tabs)')")

    expect(effectStart).toBeGreaterThan(-1)
    expect(bridgeWrite).toBeGreaterThan(effectStart)
    expect(redirect).toBeGreaterThan(bridgeWrite)
    expect(source).toContain("useRef<{ value: string | undefined } | null>(null)")
    expect(source).not.toContain('<Redirect')
  })
})
