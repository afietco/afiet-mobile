import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  addFoodReducer,
  canAdvance,
  canGoBack,
  canSaveDraft,
  createFlowState,
  telemetrySource,
  type AddFoodFlowState,
} from '../../apps/mobile/src/features/nutrition/addfood/addFoodMachine'
import type { FoodDraft } from '../../apps/mobile/src/features/nutrition/addfood/contract'

const source = (relativePath: string) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const resolvedDraft: FoodDraft = {
  name: 'Mercimek çorbası',
  groups: ['bakliyat'],
  measure: 'kase',
  quantity: 1,
  origin: 'catalog',
}

/** Walks the machine through a list of actions from a starting state. */
const run = (state: AddFoodFlowState, ...actions: Parameters<typeof addFoodReducer>[1][]) =>
  actions.reduce(addFoodReducer, state)

describe('add food step machine', () => {
  it('opens on meal selection when no meal is preset', () => {
    const state = createFlowState(null)

    expect(state.step).toBe('meal')
    expect(state.entryStep).toBe('meal')
    expect(state.meal).toBeNull()
    expect(canGoBack(state)).toBe(false)
  })

  it('skips meal selection when the caller already knows the meal', () => {
    const state = createFlowState('ogle')

    expect(state.step).toBe('search')
    expect(state.entryStep).toBe('search')
    expect(state.meal).toBe('ogle')
  })

  it('advances the moment a meal is chosen, without a confirm action', () => {
    const state = run(createFlowState(null), { type: 'meal', meal: 'kahvalti' })

    expect(state.meal).toBe('kahvalti')
    expect(state.step).toBe('search')
    expect(state.direction).toBe('forward')
  })

  it('changes the meal without skipping ahead when chosen from a later step', () => {
    const searching = run(createFlowState(null), { type: 'meal', meal: 'kahvalti' })
    const state = run(searching, { type: 'meal', meal: 'aksam' })

    expect(state.meal).toBe('aksam')
    expect(state.step).toBe('search')
  })

  it('keeps a freehand name from walking past the search step', () => {
    const state = run(createFlowState('ogle'), {
      type: 'draft',
      patch: { name: 'ev yemeği', origin: null },
    })

    expect(canAdvance(state)).toBe(false)
    expect(run(state, { type: 'advance' }).step).toBe('search')
  })

  it('lets a food with an origin walk on to the details step', () => {
    const state = run(
      createFlowState('ogle'),
      { type: 'draft', patch: { name: 'Mercimek çorbası', origin: 'catalog' } },
      { type: 'advance' },
    )

    expect(state.step).toBe('details')
  })

  it('stays on the details step because there is nothing after it', () => {
    const details = run(
      createFlowState('ogle'),
      { type: 'draft', patch: { name: 'Yoğurt', origin: 'menu' } },
      { type: 'advance' },
    )

    expect(canAdvance(details)).toBe(false)
    expect(run(details, { type: 'advance' }).step).toBe('details')
  })

  it('walks the steps in reverse and marks the direction', () => {
    const details = run(
      createFlowState(null),
      { type: 'meal', meal: 'aksam' },
      { type: 'draft', patch: { name: 'Yoğurt', origin: 'menu' } },
      { type: 'advance' },
    )
    const back = run(details, { type: 'back' })

    expect(back.step).toBe('search')
    expect(back.direction).toBe('back')
    expect(run(back, { type: 'back' }).step).toBe('meal')
  })

  it('never walks behind the step the flow opened on', () => {
    const state = run(
      createFlowState('kahvalti'),
      { type: 'draft', patch: { name: 'Yoğurt', origin: 'menu' } },
      { type: 'advance' },
      { type: 'back' },
      { type: 'back' },
    )

    expect(state.step).toBe('search')
    expect(canGoBack(state)).toBe(false)
  })

  it('keeps the draft while stepping back so a choice is not lost', () => {
    const state = run(
      createFlowState('ogle'),
      { type: 'draft', patch: resolvedDraft },
      { type: 'advance' },
      { type: 'back' },
    )

    expect(state.draft).toEqual(resolvedDraft)
  })

  it('merges draft patches without moving the flow', () => {
    const state = run(
      createFlowState('ogle'),
      { type: 'draft', patch: { name: 'Pilav', origin: 'catalog', groups: ['tahil'] } },
      { type: 'draft', patch: { quantity: 2 } },
    )

    expect(state.draft).toEqual({
      name: 'Pilav',
      groups: ['tahil'],
      measure: 'porsiyon',
      quantity: 2,
      origin: 'catalog',
    })
    expect(state.step).toBe('search')
  })

  it('returns to a clean flow on reset', () => {
    const dirty = run(
      createFlowState(null),
      { type: 'meal', meal: 'ara' },
      { type: 'draft', patch: resolvedDraft },
    )

    expect(run(dirty, { type: 'reset', meal: null })).toEqual(createFlowState(null))
  })
})

describe('add food save gating', () => {
  const withDraft = (meal: AddFoodFlowState['meal'], draft: Partial<FoodDraft>) => ({
    ...createFlowState(meal),
    draft: { ...resolvedDraft, ...draft },
  })

  it('accepts a resolved draft that has a meal behind it', () => {
    expect(canSaveDraft(withDraft('ogle', {}))).toBe(true)
  })

  it('refuses a freehand food that never went through Afi or the catalogue', () => {
    expect(canSaveDraft(withDraft('ogle', { origin: null }))).toBe(false)
  })

  it('refuses a food with no group, because it could not move the balance', () => {
    expect(canSaveDraft(withDraft('ogle', { groups: [] }))).toBe(false)
  })

  it('refuses a blank or whitespace name', () => {
    expect(canSaveDraft(withDraft('ogle', { name: '   ' }))).toBe(false)
  })

  it('refuses to write before a meal is chosen', () => {
    expect(canSaveDraft(withDraft(null, {}))).toBe(false)
  })

  it('reports every origin with the vocabulary the rest of the app emits', () => {
    expect(telemetrySource('catalog')).toBe('seed')
    expect(telemetrySource('menu')).toBe('custom')
    expect(telemetrySource('photo')).toBe('custom')
    expect(telemetrySource('bookmark')).toBe('custom')
    expect(telemetrySource(null)).toBe('custom')
  })
})

describe('add food flow wiring', () => {
  it('keeps the save path, telemetry, celebration and day rollover of the old sheet', async () => {
    const hook = await source('../../apps/mobile/src/features/nutrition/addfood/useAddFoodFlow.ts')

    expect(hook).toContain('canSaveDraft(current)')
    expect(hook).toContain('resolveMealEntryDate()')
    expect(hook).toContain('mealRepo.add(')
    expect(hook).toContain("track('meal_logged'")
    expect(hook).toContain("ftueSeen('firstMealCelebrated')")
    expect(hook).toContain("markFtueSeen('firstMealCelebrated')")
    expect(hook).toContain("AppState.addEventListener('change'")
    expect(hook).toContain('Haptics.NotificationFeedbackType.Success')
    expect(hook).toContain('Öğünü kaydedemedik. Bağlantını kontrol edip tekrar dene.')
    expect(hook).toContain('Haptics.selectionAsync()')
  })

  it('gives every step after the first a back control and no confirm action', async () => {
    const host = await source('../../apps/mobile/src/features/nutrition/addfood/AddFoodFlow.tsx')
    const mealStep = await source('../../apps/mobile/src/features/nutrition/addfood/MealStep.tsx')

    expect(host).toContain('flow.canGoBack ?')
    expect(host).toContain('Önceki adıma dön')
    expect(host).toContain('contentPanning={false}')
    expect(host).toContain("from './FoodSearchStep'")
    expect(host).toContain("from './FoodDetailsStep'")
    expect(mealStep).not.toMatch(/Devam|Onayla|İleri/)
  })

  it('changes Afi stance with the step', async () => {
    const cues = await source('../../apps/mobile/src/features/nutrition/addfood/cues.ts')
    const guide = await source('../../apps/mobile/src/features/nutrition/addfood/AfiStepGuide.tsx')

    expect(cues).toContain("meal: { pose: 'selam'")
    expect(cues).toContain("search: { pose: 'arama'")
    expect(cues).toContain("details: { pose: 'kasik'")
    expect(guide).toContain('trigger={beat}')
  })

  /**
   * The bug this guards is the one people actually hit on a first launch: the
   * sheet open on "Kahvaltı · Besin Ekle", Afi in the corner, and nothing
   * underneath it.
   *
   * An entering animation owns its view's first frame. Reanimated commits the
   * hidden state and only reveals it when the animation runs, so a run that
   * never happens leaves the step mounted and unreachable. Everything that
   * went missing was inside one of these; everything outside them survived.
   * The tab scenes lost a cross-fade for the same symptom (8058090).
   *
   * Nothing in this flow may make itself visible that way again.
   */
  it('never hides a step behind an entering animation', async () => {
    const guide = await source('../../apps/mobile/src/features/nutrition/addfood/AfiStepGuide.tsx')
    const host = await source('../../apps/mobile/src/features/nutrition/addfood/AddFoodFlow.tsx')

    expect(host).not.toMatch(/entering=/)
    expect(guide).not.toMatch(/entering=/)
  })

  /* A throw while rendering a step unmounts the subtree, and a release build
     has no red box: the sheet would stay open and empty. Sheets draw in the
     overlay layer, outside the route, so the route's own boundary is not it. */
  it('keeps a failed step recoverable inside the sheet', async () => {
    const host = await source('../../apps/mobile/src/features/nutrition/addfood/AddFoodFlow.tsx')

    expect(host).toContain('InlineErrorBoundary')
  })
})
