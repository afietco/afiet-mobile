import { describe, expect, it } from 'vitest'
import { parseSentence, SENTENCE_FOOD_LIMIT } from './sentenceParse'

/**
 * These are contract tests, not tests of the local reader.
 *
 * Everything asserted here has to stay true when the agent replaces the reader
 * (docs/besin-cumle-girisi.md, phase 2): the amounts that were stated are kept,
 * the ones that were not are marked rather than invented, unknown foods keep
 * the person's own spelling, and no answer is ever longer than the queue.
 */
describe('reading a sentence into foods', () => {
  it('splits what someone ate into separate foods', async () => {
    const foods = await parseSentence('4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir')

    expect(foods).toHaveLength(3)
    expect(foods.map((food) => food.name.toLocaleLowerCase('tr'))).toEqual([
      'yumurtalı omlet',
      'ekmek',
      'çeçil peynir',
    ])
  })

  it('keeps the amount that was stated, and says when there was none', async () => {
    const [omlet, ekmek, peynir] = await parseSentence(
      '4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir',
    )

    expect(ekmek.quantity).toBe(1)
    expect(ekmek.measure).toBe('dilim')
    expect(ekmek.amountKnown).toBe(true)

    // "biraz" is not an amount, so the fallback shows and is marked as ours.
    expect(peynir.quantity).toBe(1)
    expect(peynir.measure).toBe('porsiyon')
    expect(peynir.amountKnown).toBe(false)

    expect(omlet.quantity).toBe(4)
  })

  it("writes an unknown food the way the person spelled it", async () => {
    const [peynir] = await parseSentence('biraz çeçil peynir')

    /* Matching folds the Turkish letters; the name must not. A log that reads
       "cecil peynir" is the person's own record misspelled by us. */
    expect(peynir.name).toBe('çeçil peynir')
    expect(peynir.inPool).toBe(false)
    // Nothing here may invent what a food is made of; the step asks instead.
    expect(peynir.groups).toEqual([])
  })

  it('resolves a food the catalogue knows, with its groups', async () => {
    const [menemen] = await parseSentence('kahvaltıda menemen ve iki dilim ekmek yedim')

    expect(menemen.name).toBe('Menemen')
    expect(menemen.inPool).toBe(true)
    expect(menemen.groups.length).toBeGreaterThan(0)
  })

  it('never answers a slice of bread with a dessert', async () => {
    /* "ekmek" is inside "Ekmek kadayıfı", and a containment test that ran both
       ways logged the dessert. What was said must contain the catalogue name,
       not the other way round. */
    const [ekmek] = await parseSentence('1 dilim ekmek')

    expect(ekmek.name.toLocaleLowerCase('tr')).not.toContain('kadayıf')
  })

  it('reads a sentence that never mentions an amount', async () => {
    const foods = await parseSentence('öğlen tavuk şiş pilav ve ayran')

    expect(foods.length).toBeGreaterThan(1)
    expect(foods.every((food) => food.amountKnown === false)).toBe(true)
  })

  it('answers nothing for something that holds no food', async () => {
    expect(await parseSentence('   ')).toEqual([])
    expect(await parseSentence('bir')).toEqual([])
  })

  it('never returns more than the queue can hold', async () => {
    const long = Array.from({ length: 12 }, (_, i) => `${i + 1} dilim ekmek`).join(' ')

    expect((await parseSentence(long)).length).toBeLessThanOrEqual(SENTENCE_FOOD_LIMIT)
  })
})
