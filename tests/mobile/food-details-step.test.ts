import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AFI_FILL_PROMPT_MAX_LENGTH,
  composeFillPrompt,
  forgetFilledMenuFood,
  rememberFilledMenuFood,
  takeFilledMenuFood,
} from '@/features/nutrition/addfood/afiFill'

const step = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/FoodDetailsStep.tsx', import.meta.url),
  'utf8',
)

const runes = (value: string) => Array.from(value).length

/*
 * The details step no longer has a fill mode.
 *
 * It used to take a second arrival: a bare name, walked here to be described
 * under a "besin bilgisi" field and posted to the food-suggest agent, with the
 * group, measure and quantity controls locked until that answer landed. An
 * unknown food now goes to Afi in the photo-and-chat screen, which writes its
 * own entry, so the step only ever sees a resolved food. The prompt helpers
 * below survive because CustomFoodSheet still calls them, where somebody is
 * deliberately teaching the app a food rather than logging a meal.
 */
describe('afi fill prompt', () => {
  it('carries the description alongside the name', () => {
    expect(composeFillPrompt('mercimek çorbası', 'kırmızı mercimekten, az yağlı')).toBe(
      'mercimek çorbası (kırmızı mercimekten, az yağlı)',
    )
  })

  it('collapses stray whitespace so the request stays stable', () => {
    expect(composeFillPrompt('  mercimek   çorbası ', ' ev  yapımı ')).toBe(
      'mercimek çorbası (ev yapımı)',
    )
  })

  it('never exceeds the length the suggestion endpoint accepts', () => {
    const prompt = composeFillPrompt(
      'babaannemin fırında yaptığı zeytinyağlı yaprak sarması',
      'içi pirinç, kuş üzümü, dolmalık fıstık ve bolca dereotu ile hazırlanır, limonla servis edilir',
    )
    expect(runes(prompt)).toBeLessThanOrEqual(AFI_FILL_PROMPT_MAX_LENGTH)
    expect(prompt.startsWith('babaannemin fırında yaptığı zeytinyağlı yaprak sarması')).toBe(true)
  })

  it('cuts the description on a word boundary rather than mid word', () => {
    const prompt = composeFillPrompt('yaprak sarması', 'x'.repeat(40) + ' kısa')
    expect(prompt).toBe('yaprak sarması (' + 'x'.repeat(40) + ' kısa)')
    const tight = composeFillPrompt('yaprak sarması', 'y'.repeat(70) + ' kuyruk')
    expect(tight).toBe('yaprak sarması')
  })

  it('falls back to the name alone when nothing else fits', () => {
    const longName = 'a'.repeat(AFI_FILL_PROMPT_MAX_LENGTH)
    expect(composeFillPrompt(longName, 'ev yapımı')).toBe(longName)
  })
})

describe('filled menu food handoff', () => {
  it('hands the learned food over exactly once', () => {
    forgetFilledMenuFood()
    expect(takeFilledMenuFood()).toBeNull()
    rememberFilledMenuFood({
      name: 'babaannemin dolması',
      groups: ['sebze'],
      measure: 'adet',
      description: 'zeytinyağlı',
    })
    expect(takeFilledMenuFood()).toMatchObject({
      name: 'babaannemin dolması',
      description: 'zeytinyağlı',
    })
    expect(takeFilledMenuFood()).toBeNull()
  })
})

describe('food details step', () => {
  it('takes no typing: every food that reaches it is already resolved', () => {
    expect(step).not.toContain('Besin bilgisi')
    expect(step).not.toContain('Afi doldur')
    expect(step).not.toMatch(/<(BottomSheet)?TextInput[\s/>]/)
  })

  it('locks nothing, because there is no longer anything to unlock', () => {
    expect(step).not.toContain('const locked')
    expect(step).not.toContain("pointerEvents={locked ? 'none' : 'auto'}")
    expect(step).not.toContain('<IconLock')
  })

  it('opens its group board for a food the sentence reader could not classify', () => {
    /* `parseSentence` returns groups: [] for anything the catalogue does not
       know, on purpose: nothing there may invent what a food is made of. That
       food used to land in the locked fill mode, where the save button stayed
       disabled and the only way to light it up was to describe the food again
       under a second form. It now lands on an open board with one thing left
       to do, and the line below says what that is. */
    expect(step).toContain('const editingGroups = showAllGroups || draft.groups.length === 0')
    expect(step).toContain('Kaydetmek için en az bir besin grubu seçili olsun.')
  })

  it('offers only the measures the macros can actually be scaled to', () => {
    /* The bug this closes: a per-portion dish logged as "3 kaşık" counted as
       three whole portions, because the measure was never read back. */
    expect(step).toContain('allowedMeasures(baseMeasure, draft.gramPerMeasure)')
    expect(step).not.toContain('FOOD_MEASURES.map')
  })

  it('states a single allowed measure instead of offering it as a choice', () => {
    expect(step).toContain('measures.length > 1 ?')
  })

  it('carries the amount across a change of measure', () => {
    expect(step).toContain(
      'convertQuantity(draft.quantity, draft.measure, measure, draft.gramPerMeasure)',
    )
  })

  it('reads the stepper bounds from the measure rather than one fixed range', () => {
    expect(step).toContain('quantityRange(measure)')
    expect(step).not.toMatch(/const QTY_(MIN|MAX|STEP) =/)
  })

  it('drives the host mascot through the flow cues', () => {
    expect(step).toContain("{ pose: 'buldum'")
    expect(step).toContain("{ pose: 'kutlama'")
  })

  it('ends with the save action the host owns and adds no confirmation of its own', () => {
    expect(step).toContain('onSave(andAnother)')
    expect(step).not.toContain('Switch')
    expect(step).not.toContain('Checkbox')
    expect(step).not.toContain('onBack')
    expect(step).not.toMatch(/Geri (dön|al)/)
  })

  it('offers to keep going, because a meal is usually several foods', () => {
    /* Saving one food used to close the sheet outright, so adding a second one
       meant reopening it and picking the meal again. */
    expect(step).toContain('onPress={() => handleSave(false)}')
    expect(step).toContain('onPress={() => handleSave(true)}')
    expect(step).toContain('Kaydet ve bir daha ekle')
    // Both paths obey the same gate; neither can write an unresolved draft.
    expect(step).toMatch(/const handleSave = \(andAnother = false\) => \{\s*if \(!canSave \|\| saving\) return/)
  })

  it('memoizes the group board so quantity taps do not re-render it', () => {
    expect(step).toContain('const GroupGrid = memo(')
    expect(step).toContain('const MeasureRow = memo(')
    expect(step).toContain('const QuantityStepper = memo(')
  })

  it('uses the selection haptic for stepper and chip changes', () => {
    expect(step.match(/Haptics\.selectionAsync\(\)/g)?.length).toBe(3)
  })

  it('keeps the copy free of counting and of the em dash', () => {
    expect(step).not.toContain(String.fromCharCode(0x2014))
    expect(step).not.toMatch(/kalori|kcal/i)
  })
})
