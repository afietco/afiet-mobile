import { SEED_FOODS } from '@afiet/core/foods'
import { describe, expect, it } from 'vitest'
import { looksLikeSentence } from './sentenceInput'

describe('sentence detection', () => {
  it('recognises what someone actually types after a meal', () => {
    const sentences = [
      '4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir',
      'kahvaltıda menemen ve iki dilim ekmek yedim',
      'bir tabak mercimek çorbası yarım ekmek',
      'öğlen tavuk şiş pilav ve ayran',
      'iki bardak süt bir muz',
      // A comma is someone listing things; no catalogue name carries one.
      'menemen, ekmek, çay',
      'zeytin, beyaz peynir',
    ]

    for (const text of sentences) {
      expect(looksLikeSentence(text), text).toBe(true)
    }
  })

  /**
   * The half that matters more.
   *
   * A row offering to "read the sentence" while someone is typing an ordinary
   * food name sits directly over the result they are reaching for. Turkish
   * food names run long, so this list is where the rules earn their keep.
   */
  it('stays quiet for ordinary food names, however long', () => {
    const names = [
      'peynir',
      'beyaz peynir',
      'tavuk şiş',
      'zeytinyağlı taze fasulye',
      'mercimek çorbası',
      'peynirli omlet',
      'tam buğday ekmeği',
      'yarım avokado',
      'karnıyarık',
    ]

    for (const text of names) {
      expect(looksLikeSentence(text), text).toBe(false)
    }
  })

  it('never fires on a catalogue food, whatever its name is made of', () => {
    /* The catalogue is the ground truth for "this is a name": every single
       entry has to stay out of the sentence path, because each one is a row
       the person could be reaching for. */
    const offenders = SEED_FOODS.map((food) => food.name).filter((name) => looksLikeSentence(name))

    expect(offenders).toEqual([])
  }, 120_000)

  it('ignores fragments and stray typing', () => {
    expect(looksLikeSentence('')).toBe(false)
    expect(looksLikeSentence('   ')).toBe(false)
    expect(looksLikeSentence('ek')).toBe(false)
    expect(looksLikeSentence('a b c')).toBe(false)
  })

  it('refuses a paragraph', () => {
    expect(looksLikeSentence('bugün sabah '.repeat(40))).toBe(false)
  })
})
