import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  balanceRingsLabel,
  bmiBarLabel,
  macroRingsLabel,
  rhythmStripLabel,
} from '../../apps/mobile/src/features/accessibility/chartLabels'

const componentSource = (path: string) =>
  readFileSync(new URL(`../../apps/mobile/src/features/${path}`, import.meta.url), 'utf8')

describe('chart accessibility summaries', () => {
  it('summarizes macro values and targets', () => {
    const label = macroRingsLabel(
      { kcal: 1250, protein: 45, carb: 160, fat: 50 },
      { energyKcal: 2000, protein: 75, carb: 250, fat: 65 },
    )

    expect(label).toContain('Enerji: 1.250 / 2.000 kilokalori, yüzde 63')
    expect(label).toContain('Protein: 45 / 75 gram, yüzde 60')
  })

  it('summarizes rhythm days including today', () => {
    expect(rhythmStripLabel([true, false, true, false, false, false, false], 2)).toBe(
      'Afiyet ritmi. 2 / 7 afiyet günü. Kayıt olan günler: Pazartesi, Çarşamba. Bugün afiyet günü',
    )
  })

  it('summarizes BMI value and range', () => {
    expect(bmiBarLabel(22.4)).toBe('Vücut kitle indeksi 22,4. Denge aralığı')
  })

  it('summarizes covered and missing balance groups', () => {
    expect(balanceRingsLabel(['Sebze', 'Protein'], ['Meyve', 'Tahıl', 'Süt'])).toBe(
      'Günlük besin dengesi. 2 / 5 temel grup mevcut. Mevcut gruplar: Sebze, Protein. Henüz yer almayan gruplar: Meyve, Tahıl, Süt',
    )
  })

  it.each([
    ['nutrition/MacroRings.tsx', 'macroRingsLabel'],
    ['sofra/RhythmStrip.tsx', 'rhythmStripLabel'],
    ['body/BmiBar.tsx', 'bmiBarLabel'],
    ['nutrition/BalanceSummary.tsx', 'balanceRingsLabel'],
  ])('exposes the %s chart as one labeled image', (path, labelHelper) => {
    const source = componentSource(path)
    expect(source).toContain('accessible')
    expect(source).toContain('accessibilityRole="image"')
    expect(source).toContain(`accessibilityLabel={${labelHelper}`)
  })
})
