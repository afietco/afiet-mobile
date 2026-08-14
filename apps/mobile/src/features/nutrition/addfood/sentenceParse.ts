import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  type FoodGroup,
  type FoodMeasure,
  type Macros,
} from '@afiet/core'
import { normalizeFoodSearch, searchSeedFoods, type SeedFood } from '@afiet/core/foods'
import { requireApi } from '@/data/api/apiHolder'
import type { ApiSentenceFood } from '@/data/api/client'
import { SENTENCE_MAX_LENGTH } from './sentenceInput'

/**
 * Turning "what I ate" into rows the flow can log.
 *
 * This module is the seam. Above it the screen only ever sees `parseSentence`
 * and the shape it returns; below it is the `afi-besin-ayiklayici` agent
 * through `POST /v1/afi/besin-ayikla`, with a local reader kept as the answer
 * for a device that cannot reach it.
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
  /**
   * Approximate values for ONE measure, straight from the reader.
   *
   * Absent from the local fallback, which invents nothing, and that absence is
   * the whole reason it is optional: a food with no values must not be learned
   * into the menu, because every total it later appears in would come out
   * quietly short (see `loadParsedFood`).
   */
  macros?: Macros
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
const GROUP_KEYS = new Set<string>(FOOD_GROUPS.map((group) => group.key))

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
 * The reader of last resort, for when the agent cannot be reached.
 *
 * It cuts the sentence at the amounts, strips what is grammar rather than food,
 * and asks the catalogue about what is left. It is deliberately worse than the
 * agent and cannot be mistaken for it: no food outside the catalogue, no
 * macros, and no way to tell that "4 yumurtalı" describes the omelette rather
 * than counting omelettes. It exists because an offline sentence with three
 * catalogue foods in it is still better answered than refused.
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

/** Validates one food at the boundary, whatever the server said it was. */
function toParsed(food: ApiSentenceFood): ParsedFood | null {
  const name = food.name.trim()
  if (!name) return null
  const groups = food.groups.filter((g): g is FoodGroup => GROUP_KEYS.has(g))
  const quantity =
    Number.isFinite(food.quantity) && food.quantity > 0 ? food.quantity : 1
  return {
    name,
    groups,
    measure: MEASURE_KEYS.has(food.measure) ? (food.measure as FoodMeasure) : 'porsiyon',
    quantity,
    amountKnown: food.amountKnown === true,
    inPool: food.inPool === true,
    macros: readMacros(food.macros),
  }
}

/**
 * The values, or nothing.
 *
 * Every field has to be a real number for the set to be usable: a partial one
 * would add up to a total that looks complete and is not. The server already
 * clamps the ranges; this only refuses what is missing or not a number.
 */
function readMacros(raw: ApiSentenceFood['macros']): Macros | undefined {
  if (!raw) return undefined
  const values = [raw.kcal, raw.protein, raw.carb, raw.fat]
  if (!values.every((value) => Number.isFinite(value) && value >= 0)) return undefined
  return { kcal: raw.kcal, protein: raw.protein, carb: raw.carb, fat: raw.fat }
}

/**
 * Reads a sentence into foods.
 *
 * The agent answers; the device answers only when the agent cannot be reached.
 * Falling back rather than failing is the right trade here because nothing is
 * written yet: every food comes back as a draft the person still confirms, so
 * the worst a poorer reading costs is a correction, while a failure costs the
 * whole sentence they just typed.
 *
 * A refusal the person can act on is NOT swallowed: the daily limit and a
 * bad request both surface, because retrying is not what either of them needs.
 */
export async function parseSentence(text: string, signal?: AbortSignal): Promise<ParsedFood[]> {
  const trimmed = text.trim().slice(0, SENTENCE_MAX_LENGTH)
  if (!trimmed) return []
  try {
    const reading = await requireApi().afiSentence(trimmed, signal)
    const foods = reading.foods
      .map(toParsed)
      .filter((food): food is ParsedFood => food !== null)
      .slice(0, SENTENCE_FOOD_LIMIT)
    /* An empty answer is an answer: the agent looked and found no food. The
       local reader would only find the same nothing, or worse, invent a row
       out of the sentence's own grammar. */
    return foods
  } catch (error) {
    if (isActionableError(error)) throw error
    return readLocally(trimmed).slice(0, SENTENCE_FOOD_LIMIT)
  }
}

/** Whether the person, rather than the connection, is what the error is about. */
function isActionableError(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status
  return status === 429 || status === 400
}
