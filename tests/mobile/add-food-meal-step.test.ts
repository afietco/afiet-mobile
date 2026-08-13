import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * The meal step is the shortest screen in the flow and used to leave the bottom
 * two thirds of an 85% sheet empty. What fills it must earn the room without
 * competing with the four meal cards for the tap.
 */
const step = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/MealStep.tsx', import.meta.url),
  'utf8',
)

const sheet = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/DietProgramsSheet.tsx', import.meta.url),
  'utf8',
)

describe('meal step', () => {
  it('still answers its one question with four cards and no confirm button', () => {
    expect(step).toContain('MEAL_TYPES.slice(0, 2)')
    expect(step).toContain('onPress={() => onPress(mealType)}')
    expect(step).not.toContain('Devam')
  })

  it('says the diet programs card is not ready, on the card itself', () => {
    expect(step).toContain('Diyet programları')
    expect(step).toContain('hazırlanıyor')
  })

  it('gives the unfinished card somewhere to go instead of a dead tap', () => {
    expect(step).toContain('setProgramsOpen(true)')
    expect(step).toContain('<DietProgramsSheet')
  })

  it('promises nothing it would have to walk back', () => {
    expect(sheet).not.toMatch(/yakında.{0,20}(gün|hafta|ay)/i)
    expect(sheet).not.toMatch(/\b20\d\d\b/)
    expect(sheet).toContain('Anladım')
  })

  it('offers to build a sofra only to somebody who has none', () => {
    expect(step).toContain('sofras !== undefined && sofras.length === 0')
    expect(step).toContain('Sofranı kur')
  })

  it('waits for a real answer before saying there is no sofra', () => {
    // Undefined is "still loading"; flashing the card at somebody with five
    // sofras is worse than showing it a beat late.
    expect(step).toContain('const sofras = useSofrasResult().data')
  })

  it('sends the sofra card where sofras are actually built', () => {
    expect(step).toContain('onExitToMenu()')
    expect(step).toContain("Menüm'e git")
  })

  it('keeps the copy free of counting and of the em dash', () => {
    expect(step).not.toContain(String.fromCharCode(0x2014))
    expect(sheet).not.toContain(String.fromCharCode(0x2014))
    expect(step).not.toMatch(/kalori|kcal/i)
  })
})
