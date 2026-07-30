import { describe, expect, it } from 'vitest'
import { buildNutritionMoments, type AfiNutritionEntry } from './afiNutritionMoment'

/**
 * The one note that is about what the person put on the plate rather than what
 * is missing from it, so the things worth pinning down are: it only ever names
 * a food the catalogue can open, it agrees with the meal and with whether the
 * food is drunk or eaten, and it never gets in front of a real invitation.
 */

const entry = (over: Partial<AfiNutritionEntry> = {}): AfiNutritionEntry => ({
  meal: 'aksam',
  groups: ['protein'],
  foodName: 'Sulu köfte',
  ...over,
})

const praise = (input: Parameters<typeof buildNutritionMoments>[0]) =>
  buildNutritionMoments(input).find((moment) => moment.action === 'food-detail')

describe('Afi praises a logged food', () => {
  it('names the food and links to its detail', () => {
    const moment = praise({ hour: 20, entries: [entry()], missingGroups: [] })
    expect(moment?.food).toBe('Sulu köfte')
    expect(moment?.line).toContain('Sulu köfte')
  })

  it('says içtiğin for a drink and yediğin for a dish', () => {
    const drink = praise({
      hour: 16,
      entries: [entry({ foodName: 'Ayran', meal: 'ara', groups: ['sut'] })],
      missingGroups: [],
    })
    const dish = praise({ hour: 20, entries: [entry()], missingGroups: [] })
    // Only the templates that use the verb carry it, so at most one is checked.
    if (drink?.line.includes('tiğin') || drink?.line.includes('diğin')) {
      expect(drink.line).toContain('içtiğin')
    }
    if (dish?.line.includes('tiğin') || dish?.line.includes('diğin')) {
      expect(dish.line).toContain('yediğin')
    }
  })

  /* A menu entry of the person's own, or a food Afi named from a photo, has no
     catalogue page: praising it would put a compliment on a dead tap. */
  it('stays quiet about a food the catalogue does not carry', () => {
    const moment = praise({
      hour: 20,
      entries: [entry({ foodName: 'Anneannemin böreği' })],
      missingGroups: [],
    })
    expect(moment).toBeUndefined()
  })

  it('reaches past an unknown food to the last one it does know', () => {
    const moment = praise({
      hour: 20,
      entries: [entry({ foodName: 'Yoğurt' }), entry({ foodName: 'Anneannemin böreği' })],
      missingGroups: [],
    })
    expect(moment?.food).toBe('Yoğurt')
  })

  it('says nothing on an empty day', () => {
    expect(praise({ hour: 20, entries: [], missingGroups: ['sebze'] })).toBeUndefined()
  })

  // The compliment is not an errand. Anything that asks for something has to
  // be read first, or the note turns into flattery over an unfinished plate.
  it('comes after every note that asks for something', () => {
    const moments = buildNutritionMoments({
      hour: 22,
      entries: [entry({ meal: 'kahvalti' })],
      missingGroups: ['sebze', 'meyve'],
    })
    const asks = moments.findIndex((moment) => moment.action === 'food')
    const compliment = moments.findIndex((moment) => moment.action === 'food-detail')
    expect(asks).toBeGreaterThanOrEqual(0)
    expect(compliment).toBeGreaterThan(asks)
  })

  /* The note is memoised on its own fields and rebuilt on every live tick, so
     a line that changed between two identical builds would flicker. */
  it('says the same thing about the same plate', () => {
    const input = { hour: 20, entries: [entry()], missingGroups: [] }
    expect(praise(input)?.line).toBe(praise(input)?.line)
  })
})
