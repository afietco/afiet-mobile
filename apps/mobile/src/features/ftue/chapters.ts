/**
 * The first-time experience as a queue of chapters (docs/ftue.md).
 *
 * Every rule the design rests on lives in this file as a pure function, which
 * is the point: the chapter that gets offered is decided by one call with one
 * record and one set of signals, and the whole of it is testable without a
 * screen. Nothing here reads a clock beyond the day and hour it is handed.
 *
 * The laws that turned into code:
 *
 *   1. A door only opens when there is something of the person's own behind
 *      it, so readiness is derived from their data, never from a timer. There
 *      is no window anywhere in this file: an account that comes back on the
 *      thirtieth day resumes exactly where it stopped.
 *   3. One door a day. A chapter already offered today keeps the floor; the
 *      next one waits for tomorrow.
 *   4. Taught once, reminded once, then quiet. The second refusal retires the
 *      chapter for good, and it retires as "passed", never as "failed".
 *   7. Nobody is taught what they already do: an account that arrives with a
 *      history has its chapters filled in from that history before the queue
 *      ever runs.
 */

/** Every chapter of the design, in the order the queue prefers them. */
export const CHAPTER_KEYS = [
  'balance',
  'closeDay',
  'rhythm',
  'menu',
  'direction',
  'circle',
  'trail',
  'team',
  'remind',
] as const

export type ChapterKey = (typeof CHAPTER_KEYS)[number]

/**
 * The chapters this build can actually open.
 *
 * The rest are designed and drawn in the guide as pieces still on their way,
 * with the condition that will bring them. Showing the whole table from the
 * start is deliberate: a guide that grows a new row every release reads as a
 * list of things you missed, where a table that is being laid reads as one
 * thing being finished.
 */
export const BUILT_CHAPTERS: readonly ChapterKey[] = ['balance', 'closeDay', 'rhythm', 'trail']

export type ChapterState = 'waiting' | 'showing' | 'snoozed' | 'done' | 'passed'

/**
 * A lesson explains something; a reward hands something over.
 *
 * The distinction is the whole of law 4's second half. Somebody who has waved
 * the same explanation away twice has said "stop teaching me", and the honest
 * reading of that is to stop teaching, not to keep a counter per chapter and
 * carry on with the next one. What survives is the kind that gives rather than
 * asks: a quest that is already earned is not a lesson, and holding it back
 * would be punishing somebody for not wanting a tour.
 */
const REWARD_CHAPTERS: readonly ChapterKey[] = ['trail']

export interface ChapterEntry {
  state: ChapterState
  /** How many days this chapter has been put on screen. Two is the limit. */
  offers: number
  /** The day it was last put on screen, as a local YYYY-MM-DD string. */
  day: string | null
}

/** Who else eats at this table; asked once, right after the name and emoji. */
export type TableAnswer = 'solo' | 'partner' | 'family'

export interface ChapterRecord {
  version: 1
  entries: Partial<Record<ChapterKey, ChapterEntry>>
  table: TableAnswer | null
  /** A chapter the person asked to see again from the guide. Beats the queue. */
  forced: ChapterKey | null
}

export interface ChapterSignals {
  /** Distinct days with at least one meal: the afiyet day count. */
  loggedDays: number
  mealsToday: number
  claimableQuests: number
  /** Local hour, 0-23. */
  hour: number
  /** Local YYYY-MM-DD. */
  today: string
}

export const EMPTY_RECORD: ChapterRecord = {
  version: 1,
  entries: {},
  table: null,
  forced: null,
}

const OFFER_LIMIT = 2
/** The evening, which is the only hour of the day a closing belongs to. */
export const EVENING_HOUR = 18
/** Past this many logged days the board stops waiting for its chapter. */
const BOARD_SAFETY_DAYS = 2
/** Past this many logged days the quest and league rows stop waiting too. */
const TRAIL_SAFETY_DAYS = 7

export function chapterEntry(record: ChapterRecord, key: ChapterKey): ChapterEntry {
  return record.entries[key] ?? { state: 'waiting', offers: 0, day: null }
}

/** Settled means the chapter will never ask for anything again. */
export function isSettled(record: ChapterRecord, key: ChapterKey): boolean {
  const state = chapterEntry(record, key).state
  return state === 'done' || state === 'passed'
}

/**
 * Is there something of this person's own behind the door yet?
 *
 * The first three are a spine and run in order, because each one explains what
 * the next one builds on. The trail is not part of that spine: it is a reward
 * that happens to teach, so it arrives whenever it is earned, even to somebody
 * who has waved everything else away.
 */
export function chapterReady(
  key: ChapterKey,
  record: ChapterRecord,
  signals: ChapterSignals,
): boolean {
  switch (key) {
    case 'balance':
      return signals.loggedDays >= 1
    case 'closeDay':
      return (
        isSettled(record, 'balance') && signals.mealsToday >= 1 && signals.hour >= EVENING_HOUR
      )
    case 'rhythm':
      return isSettled(record, 'closeDay') && signals.loggedDays >= 2
    case 'trail':
      return signals.claimableQuests >= 1
    default:
      // Designed, not built yet. The guide draws these; the queue never picks them.
      return false
  }
}

/**
 * The one chapter that may be on screen right now, or none.
 *
 * Order of precedence: something the person asked to see again, then whatever
 * is already on screen today, then the first ready chapter that still has a
 * turn left. A chapter that was waved away today is not offered again today,
 * and neither is anything else: that is law 3, and it is the difference
 * between a guide and a nag.
 */
export function pickChapter(record: ChapterRecord, signals: ChapterSignals): ChapterKey | null {
  if (record.forced && BUILT_CHAPTERS.includes(record.forced)) return record.forced

  for (const key of CHAPTER_KEYS) {
    const entry = chapterEntry(record, key)
    if (entry.state !== 'showing') continue
    // A chapter left showing from an earlier day gets today's decision instead.
    if (entry.day !== signals.today) break
    return chapterReady(key, record, signals) ? key : null
  }

  /* A day is spent by whatever happened on it, not only by a refusal: a
     chapter finished this morning still means today's door has been opened. */
  const offeredToday = CHAPTER_KEYS.some((key) => chapterEntry(record, key).day === signals.today)
  if (offeredToday) return null

  const teachingOver = teachingRetired(record)
  for (const key of CHAPTER_KEYS) {
    if (!BUILT_CHAPTERS.includes(key)) continue
    if (teachingOver && !REWARD_CHAPTERS.includes(key)) continue
    const entry = chapterEntry(record, key)
    if (entry.state === 'done' || entry.state === 'passed') continue
    if (entry.offers >= OFFER_LIMIT) continue
    if (!chapterReady(key, record, signals)) continue
    return key
  }

  return null
}

/**
 * Has this person said, twice, that they do not want to be taught?
 *
 * One retired lesson is enough to mean it. The chapters are not a checklist to
 * be worked through, they are one voice explaining one app, and that voice
 * takes no for an answer the first time it is given twice.
 */
export function teachingRetired(record: ChapterRecord): boolean {
  return CHAPTER_KEYS.some(
    (key) => !REWARD_CHAPTERS.includes(key) && chapterEntry(record, key).state === 'passed',
  )
}

/** Marks a chapter as put on screen today. */
export function openChapter(
  record: ChapterRecord,
  key: ChapterKey,
  today: string,
): ChapterRecord {
  const entry = chapterEntry(record, key)
  if (entry.state === 'showing' && entry.day === today) return record
  return {
    ...record,
    entries: {
      ...record.entries,
      [key]: { state: 'showing', offers: entry.offers + 1, day: today },
    },
  }
}

/** The person did the thing. This is the only ending the chapter wanted. */
export function completeChapter(record: ChapterRecord, key: ChapterKey): ChapterRecord {
  const entry = chapterEntry(record, key)
  return {
    ...record,
    forced: record.forced === key ? null : record.forced,
    entries: { ...record.entries, [key]: { ...entry, state: 'done' } },
  }
}

/**
 * The person waved it away. Once is a snooze, twice is the end of it.
 *
 * A retired chapter is not a failure and is never counted as one anywhere: the
 * guide shows it as something for another time, and it can still be asked for
 * by hand.
 */
export function dismissChapter(record: ChapterRecord, key: ChapterKey): ChapterRecord {
  const entry = chapterEntry(record, key)
  const next: ChapterState = entry.offers >= OFFER_LIMIT ? 'passed' : 'snoozed'
  return {
    ...record,
    forced: record.forced === key ? null : record.forced,
    entries: { ...record.entries, [key]: { ...entry, state: next } },
  }
}

/** Asked for again from the guide, whether or not its turn has come. */
export function forceChapter(record: ChapterRecord, key: ChapterKey): ChapterRecord {
  const entry = chapterEntry(record, key)
  return {
    ...record,
    forced: key,
    // A replay must be able to end in "done" again, so a retired chapter comes
    // back with its turns restored rather than being resurrected half spent.
    entries: { ...record.entries, [key]: { ...entry, state: 'waiting', offers: 0, day: null } },
  }
}

export interface BackfillSignals {
  loggedDays: number
  /** Sex, birth date, height and activity level are all on file. */
  hasBodyProfile: boolean
  /** Any flag written by the guided tour this system replaces. */
  legacyGuideTouched: boolean
  rhythmExplained: boolean
}

/**
 * What an account that already has a history knows before the queue starts.
 *
 * "Established" is deliberately generous, because the two mistakes are not
 * symmetric: teaching somebody something they have done for three weeks is
 * insulting, while a new account that is misread as established simply gets
 * the app the way it works today. A single logged day is not evidence, since
 * that is exactly what a brand new account has by the time it first reaches
 * Bugün: the pre-account first meal has already synced by then.
 */
export function backfillChapters(signals: BackfillSignals): ChapterRecord {
  const established =
    signals.legacyGuideTouched ||
    signals.rhythmExplained ||
    signals.hasBodyProfile ||
    signals.loggedDays >= 2
  if (!established) return EMPTY_RECORD

  const known: ChapterEntry = { state: 'done', offers: 0, day: null }
  return {
    ...EMPTY_RECORD,
    entries: { balance: known, closeDay: known, rhythm: known },
  }
}

export interface ChapterDoors {
  /** The full Bugün board, everything under the nutrition card. */
  board: boolean
  /** The quest and league rows. */
  trail: boolean
}

/**
 * Which doors of the Bugün board stand open.
 *
 * Every gate carries a safety valve on the day count, and that is not a
 * detail: a door held shut by a chapter nobody ever finished would be a
 * feature deleted by accident. Waving a chapter away costs at most a day of
 * waiting, never the thing itself.
 */
export function chapterDoors(record: ChapterRecord, signals: ChapterSignals): ChapterDoors {
  return {
    board: isSettled(record, 'closeDay') || signals.loggedDays >= BOARD_SAFETY_DAYS,
    trail: isSettled(record, 'trail') || signals.loggedDays >= TRAIL_SAFETY_DAYS,
  }
}

/**
 * True once no built chapter can ever ask for anything again.
 *
 * The screen uses this to stop querying: a finished guide that keeps a live
 * query mounted is a tax every account pays forever for two days of use.
 */
export function allChaptersSettled(record: ChapterRecord): boolean {
  const teachingOver = teachingRetired(record)
  return BUILT_CHAPTERS.every((key) => {
    if (teachingOver && !REWARD_CHAPTERS.includes(key)) return true
    const entry = chapterEntry(record, key)
    return entry.state === 'done' || entry.state === 'passed' || entry.offers >= OFFER_LIMIT
  })
}
