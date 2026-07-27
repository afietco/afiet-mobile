import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  AFI_FILL_PROMPT_MAX_LENGTH,
  composeFillPrompt,
  forgetFilledMenuFood,
  isAfiFillReady,
  rememberFilledMenuFood,
  takeFilledMenuFood,
} from '@/features/nutrition/addfood/afiFill'

const step = readFileSync(
  new URL('../../apps/mobile/src/features/nutrition/addfood/FoodDetailsStep.tsx', import.meta.url),
  'utf8',
)

const runes = (value: string) => Array.from(value).length

describe('afi fill gate', () => {
  it('stays inactive until both the name and the description are filled', () => {
    expect(isAfiFillReady({ name: '', description: '' })).toBe(false)
    expect(isAfiFillReady({ name: 'babaannemin dolması', description: '' })).toBe(false)
    expect(isAfiFillReady({ name: '', description: 'zeytinyağlı' })).toBe(false)
    expect(isAfiFillReady({ name: 'babaannemin dolması', description: '  ' })).toBe(false)
    expect(isAfiFillReady({ name: 'babaannemin dolması', description: 'zeytinyağlı' })).toBe(true)
  })

  it('does not accept a single stray keystroke as an answer', () => {
    expect(isAfiFillReady({ name: 'a', description: 'zeytinyağlı' })).toBe(false)
    expect(isAfiFillReady({ name: 'dolma', description: 'ab' })).toBe(false)
  })
})

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
  it('puts the description field directly under the food name', () => {
    expect(step.indexOf('Besin adı')).toBeGreaterThan(-1)
    expect(step.indexOf('Besin bilgisi')).toBeGreaterThan(step.indexOf('Besin adı'))
  })

  it('uses the bottom sheet input, never a bare TextInput', () => {
    expect(step).toContain('<BottomSheetTextInput')
    expect(step).not.toMatch(/<TextInput[\s/>]/)
  })

  it('sizes inputs through style instead of a text class', () => {
    expect(step).toContain('fontSize: 16')
  })

  it('keeps the metadata locked until a fill has actually landed', () => {
    expect(step).toContain("const unlocked = !fillMode || fillState === 'filled'")
    expect(step).toContain('const locked = !unlocked')
    expect(step).toContain('Grup, ölçü ve miktar Afi doldurunca açılır.')
    expect(step).toContain("pointerEvents={locked ? 'none' : 'auto'}")
    expect(step).toContain('onToggle={locked ? undefined : toggleGroup}')
    expect(step).toContain('onSelect={locked ? undefined : chooseMeasure}')
    expect(step).toContain('onNudge={locked ? undefined : nudgeQty}')
  })

  it('shows the fill action as inactive rather than hiding it', () => {
    expect(step).toContain("disabled={!fillReady || fillState === 'filling'}")
    expect(step).toContain('Ad ve besin bilgisi dolunca “Afi doldur” açılır.')
  })

  it('drives the host mascot through the flow cues', () => {
    expect(step).toContain("{ pose: 'dusunuyor'")
    expect(step).toContain("{ pose: 'buldum'")
    expect(step).toContain("{ pose: 'kutlama'")
    expect(step).toContain("{ pose: 'merak'")
  })

  it('animates the fill surface with the v2 mascot instead of a static logo', () => {
    expect(step).toContain('<AfiPose')
    expect(step).not.toContain("from '@/ui/Afi'")
  })

  it('ends with the save action the host owns and adds no confirmation of its own', () => {
    expect(step).toContain('onPress={handleSave}')
    expect(step).toContain('onSave()')
    expect(step).not.toContain('Switch')
    expect(step).not.toContain('Checkbox')
    expect(step).not.toContain('onBack')
    expect(step).not.toMatch(/Geri (dön|al)/)
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
