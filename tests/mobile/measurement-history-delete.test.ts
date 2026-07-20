import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const measurementHistoryPath = fileURLToPath(
  new URL('../../apps/mobile/src/features/body/MeasurementHistory.tsx', import.meta.url),
)

describe('measurement history deletion', () => {
  it('requires destructive confirmation before deleting a measurement', async () => {
    const source = await readFile(measurementHistoryPath, 'utf8')
    const confirmation = source.indexOf("Alert.alert(\n      'Ölçüm silinsin mi?'")
    const removal = source.indexOf('.remove(id)', confirmation)

    expect(confirmation).toBeGreaterThan(-1)
    expect(removal).toBeGreaterThan(confirmation)
    expect(source).toContain("{ text: 'Vazgeç', style: 'cancel' }")
    expect(source).toContain("style: 'destructive'")
  })

  it('provides a 44 point target and disables repeated deletion', async () => {
    const source = await readFile(measurementHistoryPath, 'utf8')

    expect(source).toContain('h-11 w-11 shrink-0 items-center justify-center')
    expect(source).toContain('disabled={deletingId !== null}')
    expect(source).toContain('accessibilityState={{ disabled: deletingId !== null }}')
  })
})
