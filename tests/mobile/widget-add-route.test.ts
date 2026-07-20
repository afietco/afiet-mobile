import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { consumePendingAdd, setPendingAdd } from '../../apps/mobile/src/features/widget/pendingAdd'

const routePath = fileURLToPath(
  new URL('../../apps/mobile/src/app/ekle.tsx', import.meta.url),
)

describe('widget add route', () => {
  it('preserves valid meals and requires an explicit choice for invalid values', () => {
    setPendingAdd('ogle')
    expect(consumePendingAdd()).toEqual({ meal: 'ogle', requiresMealSelection: false })

    setPendingAdd('invalid')
    expect(consumePendingAdd()).toEqual({ meal: null, requiresMealSelection: true })

    setPendingAdd(undefined)
    expect(consumePendingAdd()).toEqual({ meal: null, requiresMealSelection: true })
    expect(consumePendingAdd()).toBeNull()
  })

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
