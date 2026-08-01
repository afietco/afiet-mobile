import { searchSeedFoods, turkishLower } from '@afiet/core'

/**
 * "Is this a food name, or a sentence about a meal?"
 *
 * The add-food field takes one food at a time, but people write what they ate:
 * "4 yumurtalı omlet 1 dilim ekmek biraz çeçil peynir". Nothing in the
 * catalogue answers that, so the search goes empty and the flow stops on the
 * one input someone was most willing to give.
 *
 * The question this module answers is narrow on purpose: it decides only
 * whether to OFFER Afi a look. Getting it wrong in one direction shows a row
 * nobody taps; getting it wrong in the other hides a row that would have
 * helped. Neither destroys anything, so the rules stay simple and testable
 * rather than clever.
 *
 * What it must never do is fire on an ordinary food name. Turkish food names
 * are routinely two and three words ("beyaz peynir", "zeytinyağlı taze
 * fasulye"), and a suggestion sitting over the exact row someone is reaching
 * for is worse than no suggestion at all. That is what the catalogue check is
 * for: if what was typed still resolves to a food, it is a name.
 */

/** Under this a string cannot hold two foods, whatever it says. */
const MIN_WORDS = 3

/** Cheap upper bound: a paragraph is not a meal, and the endpoint caps too. */
export const SENTENCE_MAX_LENGTH = 300

/**
 * Amount words that mark a list of things eaten rather than a food's name.
 *
 * "yarım avokado" is one food and stays one; these earn their keep next to a
 * word count, never on their own.
 */
const AMOUNT_WORDS = new Set([
  'bir',
  'iki',
  'üç',
  'dört',
  'beş',
  'yarım',
  'biraz',
  'birkaç',
  'dilim',
  'kaşık',
  'bardak',
  'tabak',
  'porsiyon',
  'adet',
  'gram',
  'avuç',
  'parça',
  'tane',
])

const words = (text: string): string[] =>
  turkishLower(text).split(/[\s,;.]+/).filter(Boolean)

/** True when the text names a food the catalogue already knows, as a whole. */
function namesOneFood(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  const found = searchSeedFoods(trimmed, 1)
  if (found.length === 0) return false
  /* An exact catalogue name is a name, not a sentence, however many words it
     has. Anything looser only counts as a name while the text is still short:
     "peynirli omlet" matches a food, "peynirli omlet ve iki dilim ekmek"
     matches the same food and is plainly not one. */
  return turkishLower(found[0].name) === turkishLower(trimmed)
}

/**
 * Whether to offer "let Afi read this".
 *
 * Deliberately not a confidence score: the row is either offered or it is not,
 * and a number nobody can act on would only invite tuning it forever.
 */
export function looksLikeSentence(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 8 || trimmed.length > SENTENCE_MAX_LENGTH) return false
  if (namesOneFood(trimmed)) return false

  const parts = words(trimmed)
  if (parts.length < MIN_WORDS) return false

  const hasDigit = /\d/.test(trimmed)
  const amountWords = parts.filter((word) => AMOUNT_WORDS.has(word)).length

  /* Four or more words is a sentence on its own: no food in the catalogue is
     that long, and the ones that come close are caught above by name. */
  if (parts.length >= 4) return true

  // At exactly three words it needs a second signal that this is a list.
  return hasDigit || amountWords > 0
}
