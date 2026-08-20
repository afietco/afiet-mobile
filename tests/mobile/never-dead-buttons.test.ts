import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

/**
 * App Review reported afiet as unresponsive on 19 Aug 2026 (guideline 2.1a):
 * the measurement sheet's Kaydet was disabled because the weight field was
 * empty, and the field had scrolled out of view, so nothing on screen said so.
 *
 * The rule that came out of it: an unfinished answer never disables a primary
 * button. Only work already in flight does, because a second press would
 * duplicate it. These are the forms that carry a gate.
 */
const GATED_FORMS = [
  'src/app/first-meal.tsx',
  'src/app/onboarding.tsx',
  'src/app/profil.tsx',
  'src/features/auth/ChangeEmailSheet.tsx',
  'src/features/auth/ChangePasswordSheet.tsx',
  'src/features/body/BodySetupSheet.tsx',
  'src/features/body/MeasurementSheet.tsx',
  'src/features/groups/CreateGroupSheet.tsx',
  'src/features/groups/GroupEditSheet.tsx',
  'src/features/groups/JoinGroupSheet.tsx',
  'src/features/nutrition/AddFoodSheet.tsx',
  'src/features/nutrition/CustomFoodSheet.tsx',
  'src/features/nutrition/SofraSheet.tsx',
  'src/features/nutrition/addfood/FoodDetailsStep.tsx',
] as const

/** Names these forms use for "the answers are all in", never for "busy". */
const VALIDITY = /disabled=\{!(canSave|valid|stepValid|nameValid|emojiValid|hasName|mealSelectionConfirmed|name\.trim|code\b)/

const read = (file: string) =>
  readFile(new URL(`../../apps/mobile/${file}`, import.meta.url), 'utf8')

describe('primary buttons answer every press', () => {
  it.each(GATED_FORMS)('%s never disables itself over an unfinished answer', async (file) => {
    expect(await read(file)).not.toMatch(VALIDITY)
  })

  it.each(GATED_FORMS)('%s says what it is waiting on', async (file) => {
    expect(await read(file)).toContain("from '@/ui/formGate'")
  })

  it('raises the problem for the person and for the tester alike', async () => {
    const gate = await read('src/ui/formGate.tsx')
    // A raise is felt as well as read, and never mistaken for a save going through.
    expect(gate).toContain('Haptics.NotificationFeedbackType.Warning')
    // The form is told what was raised, so it can carry the person to the field.
    expect(gate).toContain('): FormProblem | null => {')
  })
})
