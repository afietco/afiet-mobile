import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { macroLine, sofraTotals, unknownNote } from '../../apps/mobile/src/features/nutrition/sofraMacros'
import type { SofraFood } from '../../apps/mobile/src/features/nutrition/sofra'

/**
 * A saved table is a set of foods with amounts, which is the same shape a
 * logged day has. The totals therefore come from the same arithmetic
 * (`sumMacros` in @afiet/core) rather than a second implementation that would
 * eventually disagree with the first.
 */
const food = (name: string, quantity = 1, measure: SofraFood['measure'] = null): SofraFood => ({
  name,
  groups: ['protein'],
  measure,
  quantity,
})

describe('sofra totals', () => {
  it('adds the table up from the catalogue', () => {
    // Beyaz peynir: 1 dilim = 80 kcal.
    const totals = sofraTotals([food('Beyaz peynir', 2, 'dilim')])

    expect(Math.round(totals.kcal)).toBe(160)
    expect(totals.knownCount).toBe(1)
    expect(totals.unknownCount).toBe(0)
  })

  it('reads the measure rather than multiplying blindly', () => {
    // 60 g of a food measured in 30 g slices is two slices, not sixty.
    const grams = sofraTotals([food('Beyaz peynir', 60, 'gram')])

    expect(Math.round(grams.kcal)).toBe(160)
  })

  it('counts what it could not add up instead of hiding it', () => {
    const totals = sofraTotals([food('Beyaz peynir', 1, 'dilim'), food('Bilinmeyen yemek')])

    expect(totals.knownCount).toBe(1)
    expect(totals.unknownCount).toBe(1)
    expect(unknownNote(totals)).toBe('1 besin hesaba girmedi')
  })

  it('says nothing at all when nothing could be counted', () => {
    const totals = sofraTotals([food('Bilinmeyen yemek')])

    expect(macroLine(totals)).toBeNull()
  })

  it('collects every group the table covers, once each', () => {
    const totals = sofraTotals([
      { name: 'a', groups: ['protein', 'sut'], measure: null, quantity: 1 },
      { name: 'b', groups: ['protein'], measure: null, quantity: 1 },
    ])

    expect(totals.groups).toEqual(['protein', 'sut'])
  })

  it('writes the line the four screens share', () => {
    const totals = sofraTotals([food('Beyaz peynir', 1, 'dilim')])

    expect(macroLine(totals)).toMatch(/^~\d+ kcal · P \d+g · K \d+g · Y \d+g$/)
  })
})

describe('every sofra surface shows the same total', () => {
  const read = (rel: string) =>
    readFileSync(new URL(`../../apps/mobile/src/${rel}`, import.meta.url), 'utf8')

  it('is one component rather than four copies of the arithmetic', () => {
    for (const rel of [
      'app/menum.tsx',
      'features/nutrition/SofraSheet.tsx',
      'features/nutrition/addfood/SofraStep.tsx',
      'features/nutrition/addfood/FoodSearchStep.tsx',
    ]) {
      expect(read(rel), rel).toContain('<SofraMacroLine')
    }
  })

  it('moves with the amounts on the step that adjusts them', () => {
    // `included` rather than the saved sofra: taking a food off has to show.
    expect(read('features/nutrition/addfood/SofraStep.tsx')).toContain(
      '<SofraMacroLine foods={included} showGroups />',
    )
  })
})

describe('no food enters the menu without values', () => {
  const read = (rel: string) =>
    readFileSync(new URL(`../../apps/mobile/src/${rel}`, import.meta.url), 'utf8')

  it('stops the sentence reader parking one, since it returns none', () => {
    /* A parked food with nothing to add up made every total it later appeared
       in come out quietly short. The meal entry is still written; only the
       learning is skipped. */
    expect(read('features/nutrition/addfood/useAddFoodFlow.ts')).not.toContain(
      'rememberFilledMenuFood',
    )
  })

  it('keeps the define sheet demanding them', () => {
    expect(read('features/nutrition/CustomFoodSheet.tsx')).toContain(
      'const canSave = hasName && groupsOk && macrosOk',
    )
  })
})
