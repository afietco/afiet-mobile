import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  addFoodReducer,
  canGoBack,
  createFlowState,
} from '../../apps/mobile/src/features/nutrition/addfood/addFoodMachine'

/**
 * A sofra used to be written the instant it was tapped, at whatever amounts it
 * had been saved with. Right on the morning the table really is the same as
 * always, wrong on every other one, and the only way to disagree was to add the
 * whole thing and then delete from it.
 */
const step = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/SofraStep.tsx', import.meta.url),
  'utf8',
)

const flow = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/useAddFoodFlow.ts', import.meta.url),
  'utf8',
)

describe('sofra branch in the step machine', () => {
  it('branches off search and returns to it', () => {
    const search = addFoodReducer(createFlowState('aksam'), { type: 'sofra' })

    expect(search.step).toBe('sofra')
    expect(canGoBack(search)).toBe(true)
    expect(addFoodReducer(search, { type: 'back' }).step).toBe('search')
  })

  it('is not reachable from anywhere else', () => {
    const meal = createFlowState(null)

    expect(addFoodReducer(meal, { type: 'sofra' }).step).toBe('meal')
  })

  it('never continues into the details step', () => {
    const sofra = addFoodReducer(createFlowState('aksam'), { type: 'sofra' })

    expect(addFoodReducer(sofra, { type: 'advance' }).step).toBe('sofra')
  })
})

describe('sofra step', () => {
  it('opens with the whole table included, because that is what a sofra is', () => {
    expect(step).toContain('sofra.foods.map((food) => ({ ...food, included: true }))')
  })

  it('lets each amount be adjusted on its own line', () => {
    expect(step).toContain('nudgeQuantity(line.quantity, line.measure ?? ')
    expect(step).toContain('quantityRange(measure)')
  })

  it('makes removing a food undoable rather than final', () => {
    expect(step).toContain('included: !line.included')
    expect(step).toContain('çıkarıldı')
  })

  it('refuses to write an empty table', () => {
    expect(step).toContain('disabled={saving || included.length === 0}')
    expect(step).toContain('Eklemek için sofrada en az bir besin kalsın.')
  })

  it('hands the adjusted foods up rather than the saved sofra', () => {
    expect(step).toContain('onAdd(included.map(')
    expect(flow).toContain('const addSofra = useCallback(\n    (foods: SofraFood[]) => {')
    expect(flow).toContain('for (const food of foods) {')
  })

  it('still removes a half-written sofra when one food fails', () => {
    expect(flow).toContain('[...written].reverse().map((id) => mealRepo.remove(id))')
  })

  it('keeps the copy free of counting and of the em dash', () => {
    expect(step).not.toContain(String.fromCharCode(0x2014))
    expect(step).not.toMatch(/kalori|kcal/i)
  })
})
