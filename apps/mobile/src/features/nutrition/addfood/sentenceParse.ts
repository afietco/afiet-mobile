import {
  FOOD_MEASURES,
  normalizeFoodSearch,
  searchSeedFoods,
  type FoodGroup,
  type FoodMeasure,
  type SeedFood,
} from '@afiet/core'
import { SENTENCE_MAX_LENGTH } from './sentenceInput'

/**
 * Turning "what I ate" into rows the flow can log.
 *
 * This module is the seam. Above it the screen only ever sees `parseSentence`
 * and the shape it returns; below it there is a local reader today and the
 * `POST /v1/afi/besin-ayikla` agent once that lands (docs/besin-cumle-girisi.md,
 * phase 2). Swapping them is one function body, which is the whole reason the
 * two are separated.
 *
 * The returned food carries the same fields as the photo path's `AfiPhotoFood`
 * so the queue, the draft and the details step take it without translation,
 * plus the two things a sentence adds: how much, and whether the sentence
 * actually said so.
 */

/** One food read out of a sentence. */
export interface ParsedFood {
  name: string
  groups: FoodGroup[]
  measure: FoodMeasure
  quantity: number
  /**
   * Whether the amount came from the sentence or from us.
   *
   * "1 dilim ekmek" says it; "biraz çeçil peynir" does not, and the difference
   * has to survive to the confirmation step. Guessing silently would write a
   * number the person never gave into their own record.
   */
  amountKnown: boolean
  /** Whether the catalogue or the person's menu already knows this food. */
  inPool: boolean
  emoji?: string
}

/** A sentence yields at most this many foods (decision, 1 Aug 2026). */
export const SENTENCE_FOOD_LIMIT = 6

/**
 * Every lookup below is keyed the way `normalizeFoodSearch` writes a word, not
 * the way it is spelled.
 *
 * The folding drops the Turkish letters ("kaşık" becomes "kasik", "kahvaltıda"
 * becomes "kahvaltida"), so a table written in ordinary Turkish silently never
 * matches anything. Folding the tables themselves keeps both sides in one
 * spelling and keeps the source readable.
 */
const fold = (words: string[]) => words.map((word) => normalizeFoodSearch(word))

const MEASURE_WORDS = new Map<string, FoodMeasure>(
  (
    [
      ['dilim', 'dilim'],
      ['kase', 'kase'],
      ['kâse', 'kase'],
      ['kaşık', 'kasik'],
      ['bardak', 'bardak'],
      ['fincan', 'fincan'],
      ['avuç', 'avuc'],
      ['porsiyon', 'porsiyon'],
      ['adet', 'adet'],
      ['tane', 'adet'],
    ] as [string, FoodMeasure][]
  ).map(([word, measure]) => [normalizeFoodSearch(word), measure]),
)

const NUMBER_WORDS = new Map<string, number>(
  (
    [
      ['bir', 1],
      ['iki', 2],
      ['üç', 3],
      ['dört', 4],
      ['beş', 5],
      ['altı', 6],
      ['yarım', 0.5],
    ] as [string, number][]
  ).map(([word, count]) => [normalizeFoodSearch(word), count]),
)

const MEASURE_KEYS = new Set<string>(FOOD_MEASURES.map((measure) => measure.key))

/** Words that belong to the sentence rather than to any food in it. */
const FILLER_WORDS = new Set(
  fold([
    've',
    'ile',
    'de',
    'da',
    'bir',
    'biraz',
    'birkaç',
    'yanında',
    'sonra',
    'yedim',
    'içtim',
    'sabah',
    'öğlen',
    'akşam',
    'kahvaltıda',
    'kahvaltı',
    'öğlede',
    'akşamda',
    'öğün',
  ]),
)

const OPENERS = new Set(fold(['biraz', 'birkaç']))

/**
 * A word as written and as searched.
 *
 * Both are needed at once: classification only works on the folded form, and
 * the name that ends up in someone's record has to be the one they typed.
 * Folding the display name turned "çeçil peynir" into "cecil peynir" in their
 * own log.
 */
interface Word {
  raw: string
  folded: string
}

const CUTS = new Set(fold(['ve', 'ile', 'sonra', 'yanında']))

/** Where a new food starts: an amount opens one, and so does a joining word. */
function opensAFood(word: Word): boolean {
  return (
    /\d/.test(word.folded) ||
    NUMBER_WORDS.has(word.folded) ||
    OPENERS.has(word.folded) ||
    CUTS.has(word.folded) ||
    word.raw.endsWith(',')
  )
}

/**
 * Cuts the sentence where a new food begins.
 *
 * "4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir" carries its own
 * punctuation in the amounts: every amount marks the start of the next thing
 * eaten. Sentences that skip the amounts ("tavuk şiş pilav ve ayran") lean on
 * the joining words instead, which is as far as counting words can go: telling
 * "tavuk şiş" from "pilav" without either needs the agent.
 */
function segments(text: string): Word[][] {
  const words: Word[] = text
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({ raw, folded: normalizeFoodSearch(raw) }))
    .filter((word) => word.folded.length > 0)

  const out: Word[][] = []
  for (const word of words) {
    if (out.length === 0 || (opensAFood(word) && out[out.length - 1].length > 0)) out.push([])
    /* A joining word opens the next food without belonging to it. */
    if (CUTS.has(word.folded)) continue
    out[out.length - 1].push(word)
  }
  return out.filter((part) => part.length > 0)
}

/**
 * The local reader that stands in for the agent.
 *
 * It cuts the sentence at the amounts, strips what is grammar rather than food,
 * and asks the catalogue about what is left. That is enough to walk the flow on
 * a device with real sentences, and it is emphatically NOT the feature: it
 * knows no food outside the catalogue, it cannot tell that "4 yumurtalı"
 * describes the omelette rather than counting omelettes, and it has no macros
 * to offer at all. Those three are the reason the agent exists (phase 2), and
 * this reader is deleted the day it answers.
 */
function readLocally(text: string): ParsedFood[] {
  return segments(text)
    .map((segment) => readSegment(segment))
    .filter((food): food is ParsedFood => food !== null)
    .slice(0, SENTENCE_FOOD_LIMIT)
}

function readSegment(words: Word[]): ParsedFood | null {
  let quantity: number | null = null
  let measure: FoodMeasure | undefined
  const nameWords: Word[] = []

  for (const word of words) {
    const asNumber = Number(word.folded.replace(',', '.'))
    if (Number.isFinite(asNumber) && asNumber > 0 && quantity === null) {
      quantity = asNumber
      continue
    }
    if (NUMBER_WORDS.has(word.folded) && quantity === null) {
      quantity = NUMBER_WORDS.get(word.folded) ?? null
      continue
    }
    const asMeasure = MEASURE_WORDS.get(word.folded)
    if (asMeasure && MEASURE_KEYS.has(asMeasure) && !measure) {
      measure = asMeasure
      continue
    }
    if (FILLER_WORDS.has(word.folded)) continue
    nameWords.push(word)
  }

  const written = nameWords
    .map((word) => word.raw.replace(/[,;.]+$/, ''))
    .join(' ')
    .trim()
  const spoken = normalizeFoodSearch(written)
  if (spoken.length < 2) return null

  const known = matchCatalogue(spoken)
  if (known) {
    return {
      name: known.name,
      groups: known.groups,
      measure: measure ?? known.measure,
      quantity: quantity ?? 1,
      amountKnown: quantity !== null || measure !== undefined,
      inPool: true,
      emoji: known.emoji,
    }
  }

  /* Unknown to the catalogue, so it keeps the person's own words, spelled the
     way they wrote them, and carries no groups: nothing here may invent what a
     food is made of. The confirmation step asks, exactly as it does for a food
     described by hand. */
  return {
    name: written,
    groups: [],
    measure: measure ?? 'porsiyon',
    quantity: quantity ?? 1,
    amountKnown: quantity !== null || measure !== undefined,
    inPool: false,
  }
}

/**
 * The catalogue entry a segment is talking about, if there is one.
 *
 * Containment only counts in one direction. "ekmek" is inside "Ekmek kadayıfı",
 * so the looser test answered a slice of bread with a dessert; what someone
 * said has to contain the catalogue name, not be contained by it. An exact
 * name always wins, and anything else is left unknown on purpose: a wrong food
 * logged silently is worse than a food the person has to describe.
 */
function matchCatalogue(spoken: string): SeedFood | undefined {
  const found = searchSeedFoods(spoken, 6)
  const exact = found.find((food) => normalizeFoodSearch(food.name) === spoken)
  if (exact) return exact
  return found.find((food) => {
    const name = normalizeFoodSearch(food.name)
    return spoken.includes(`${name} `) || spoken.includes(` ${name}`) || spoken === name
  })
}

/**
 * Reads a sentence into foods.
 *
 * Phase 1 answers from the device (see `readLocally`); phase 2 replaces this
 * body with the agent call and nothing above it changes.
 */
export async function parseSentence(text: string): Promise<ParsedFood[]> {
  const trimmed = text.trim().slice(0, SENTENCE_MAX_LENGTH)
  /* Kept async from the start: the real reader is a network call, and a screen
     written against a synchronous answer would have to be rewritten around the
     waiting, the failing and the cancelling when it arrives. */
  return Promise.resolve(readLocally(trimmed).slice(0, SENTENCE_FOOD_LIMIT))
}
