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
 * The chapters this build can actually open: all nine, since 1.1.
 *
 * The list is kept because the guide and the queue both read it, and because
 * a chapter can be taken out of a build again without taking it out of the
 * table: whatever is not built is drawn in the guide as a piece still on its
 * way, with the condition that will bring it.
 */
export const BUILT_CHAPTERS: readonly ChapterKey[] = CHAPTER_KEYS

/**
 * Who speaks first when more than one chapter is ready on the same day.
 *
 * The guide draws the table in CHAPTER_KEYS order, but the day has its own
 * order. Coming back after days away is a moment, and a moment does not wait
 * behind a lesson about menus; somebody who arrived through an invitation has
 * a table already laid, and that is the first thing worth saying to them. The
 * reward comes straight after the spine, ahead of every remaining lesson: it
 * hands something over, and a thing already earned should not queue behind an
 * explanation.
 */
const PRIORITY: readonly ChapterKey[] = [
  'remind',
  'balance',
  'closeDay',
  'rhythm',
  'trail',
  'menu',
  'direction',
  'circle',
  'team',
]

function pickOrder(record: ChapterRecord): readonly ChapterKey[] {
  if (!record.invited) return PRIORITY
  return ['remind', 'circle', ...PRIORITY.filter((key) => key !== 'remind' && key !== 'circle')]
}

/** What each chapter is called and what, if anything, it opens on the board. */
export const CHAPTER_META: Record<ChapterKey, { title: string; door: string | null }> = {
  balance: { title: 'Denge pusulan', door: null },
  closeDay: { title: 'Günü kapat', door: 'Su satırı' },
  rhythm: { title: 'Ritmini bul', door: 'Ritim şeridi' },
  menu: { title: 'Sofranı tanı', door: 'Menüm' },
  direction: { title: 'Yönün', door: 'Vücudum' },
  circle: { title: 'Sofrada yalnız değilsin', door: 'Grubum' },
  trail: { title: 'Yolculuğun izi', door: 'Görevlerim ve Ligim' },
  team: { title: 'Sofra takımı', door: 'Afi satırı' },
  remind: { title: 'Sofranı hatırlat', door: null },
}

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

/** When the account was last on Bugün, and how long it had been away then. */
export interface VisitRecord {
  /** Local YYYY-MM-DD of the last visit that was recorded. */
  lastDay: string | null
  /** Days between that visit and the one before it; 0 on the first day. */
  gapDays: number
}

export interface ChapterRecord {
  version: 1
  entries: Partial<Record<ChapterKey, ChapterEntry>>
  table: TableAnswer | null
  /** A chapter the person asked to see again from the guide. Beats the queue. */
  forced: ChapterKey | null
  /** Arrived through a group invitation: the table is already laid for them. */
  invited: boolean
  /**
   * Had a history before this system existed. Nothing is hidden from an
   * established account: a row they have used for weeks that vanishes on the
   * launch that updates them is not a lesson, it is a broken screen.
   */
  established: boolean
  visits: VisitRecord
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
  /** Sex, birth date, height and activity level are all on file. */
  hasBodyProfile: boolean
  hasGroup: boolean
  /** At least one saved sofra in Menüm. */
  hasSofra: boolean
  /** Foods logged on two or more different days. */
  repeatedFoods: number
  /** A food without macros was logged today. */
  unknownToday: boolean
  /** The chat screen has been opened at least once. */
  chatVisited: boolean
  /** Days since the previous visit; only non-zero on the day of the return. */
  awayDays: number
}

export const EMPTY_RECORD: ChapterRecord = {
  version: 1,
  entries: {},
  table: null,
  forced: null,
  invited: false,
  established: false,
  visits: { lastDay: null, gapDays: 0 },
}

const OFFER_LIMIT = 2
/** The evening, which is the only hour of the day a closing belongs to. */
export const EVENING_HOUR = 18
/** Past this many logged days the board stops waiting for its chapter. */
const BOARD_SAFETY_DAYS = 2
/** Past this many logged days the quest and league rows stop waiting too. */
const TRAIL_SAFETY_DAYS = 7
/** Past this many logged days the Afi row stops waiting for the team chapter. */
const CHAT_SAFETY_DAYS = 3
/** Past this many logged days the body, menu and group doors open on their own. */
const DOOR_SAFETY_DAYS = 5
/** The team is introduced by this day even if nothing else brings it up. */
const TEAM_DAY = 4
/** The direction is asked by this day if Vücudum has not been visited. */
const DIRECTION_DAY = 5
/** Days away that count as having been away. */
const AWAY_DAYS = 3
/** After this many logged days the guide's Bugün row retires on its own. */
export const GUIDE_ROW_DAYS = 14

/**
 * When the social chapter comes, by who else eats at the table.
 *
 * "Ailece" already has the people, so it comes on the second day; "eşimle"
 * mid-week; somebody at their own table hears it when their first rhythm week
 * is complete, five afiyet days, which is what a week means in this app.
 */
const CIRCLE_DAY: Record<TableAnswer, number> = { family: 2, partner: 3, solo: 5 }

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
    case 'menu':
      // The feature appears at the moment the need does: the same food again.
      return signals.repeatedFoods >= 1 && !signals.hasSofra
    case 'direction':
      return !signals.hasBodyProfile && signals.loggedDays >= DIRECTION_DAY
    case 'circle':
      if (signals.hasGroup) return false
      if (record.invited) return true
      return signals.loggedDays >= CIRCLE_DAY[record.table ?? 'solo']
    case 'team':
      return signals.unknownToday || signals.chatVisited || signals.loggedDays >= TEAM_DAY
    case 'remind':
      return signals.awayDays >= AWAY_DAYS && signals.loggedDays >= 1
  }
}

/**
 * Chapters whose lesson the person has already carried out on their own.
 *
 * Law 7 at runtime rather than only at backfill: somebody who filled in
 * Vücudum from the tab, joined a group from an invitation or saved a sofra
 * from Menüm has done the thing the chapter exists to get done. The piece goes
 * on the table quietly, and nobody is taught what they already do.
 */
export function alreadyDone(
  key: ChapterKey,
  signals: Pick<ChapterSignals, 'hasBodyProfile' | 'hasGroup' | 'hasSofra'>,
): boolean {
  switch (key) {
    case 'direction':
      return signals.hasBodyProfile
    case 'circle':
      return signals.hasGroup
    case 'menu':
      return signals.hasSofra
    default:
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
  for (const key of pickOrder(record)) {
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

/**
 * "Anlatmayı bırak", said once from the guide instead of twice to a chapter.
 *
 * Every lesson still open retires as passed, which is the same end two
 * refusals reach; the reward keeps coming, because it was never a lesson, and
 * any piece can still be asked for by hand afterwards.
 */
export function retireTeaching(record: ChapterRecord): ChapterRecord {
  const entries = { ...record.entries }
  let changed = false
  for (const key of CHAPTER_KEYS) {
    if (REWARD_CHAPTERS.includes(key)) continue
    const entry = chapterEntry(record, key)
    if (entry.state === 'done' || entry.state === 'passed') continue
    entries[key] = { ...entry, state: 'passed' }
    changed = true
  }
  return changed ? { ...record, forced: null, entries } : record
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
    established: true,
    entries: { balance: known, closeDay: known, rhythm: known },
  }
}

/**
 * The record of an account that must never be taught: every piece set, every
 * door open. Store reviewers get this; they open every screen in an hour and
 * a board that grows over a week reads to them as a board with rows missing.
 */
export function reviewerRecord(): ChapterRecord {
  const done: ChapterEntry = { state: 'done', offers: 0, day: null }
  const entries: Partial<Record<ChapterKey, ChapterEntry>> = {}
  for (const key of CHAPTER_KEYS) entries[key] = done
  return { ...EMPTY_RECORD, established: true, entries }
}

/** A local notification the app schedules for itself, in Afi's voice. */
export interface ChapterCue {
  /** 'evening' is today at the closing hour; 'morning' is tomorrow morning. */
  when: 'evening' | 'morning'
  chapter: ChapterKey
  title: string
  body: string
}

/**
 * The one cue worth scheduling right now, if any.
 *
 * Two moments the app can see coming: the closing this evening once the first
 * chapter is behind the person, and a chapter that is ready today but waits
 * for tomorrow because today's door has already been opened (law 3). Nothing
 * else is predictable from the client, and nothing here fires for somebody
 * who has stopped the lessons.
 */
export function nextChapterCue(record: ChapterRecord, signals: ChapterSignals): ChapterCue | null {
  if (teachingRetired(record)) return null
  if (
    isSettled(record, 'balance') &&
    !chapterSettled(record, 'closeDay') &&
    signals.mealsToday >= 1 &&
    signals.hour < EVENING_HOUR
  ) {
    return {
      when: 'evening',
      chapter: 'closeDay',
      title: 'Gün toparlanıyor 🥣',
      body: 'Bir bardak su koyup günü birlikte kapatalım mı?',
    }
  }
  const offeredToday = CHAPTER_KEYS.some((key) => chapterEntry(record, key).day === signals.today)
  if (!offeredToday) return null
  for (const key of pickOrder(record)) {
    /* The closing belongs to an evening and the return to a return; neither
       can be promised for tomorrow morning. */
    if (key === 'remind' || key === 'closeDay' || chapterSettled(record, key)) continue
    if (chapterEntry(record, key).day === signals.today) continue
    if (!chapterReady(key, record, signals)) continue
    return {
      when: 'morning',
      chapter: key,
      title: 'Sofraya yeni bir parça geldi',
      body: `${CHAPTER_META[key].title} seni bekliyor. Bugün açalım mı?`,
    }
  }
  return null
}

/** The account came in through a group invitation. */
export function markInvited(record: ChapterRecord): ChapterRecord {
  return record.invited ? record : { ...record, invited: true }
}

/** Whole days between two local YYYY-MM-DD strings; 0 when either is unreadable. */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`)
  const b = Date.parse(`${to}T00:00:00Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/**
 * Notes a visit to Bugün. Once per day: the gap it measures is the one that
 * was there when the day began, and it stays readable for the rest of that
 * day so the return can be answered whenever the person scrolls to it.
 */
export function recordVisit(record: ChapterRecord, today: string): ChapterRecord {
  if (record.visits.lastDay === today) return record
  const gapDays = record.visits.lastDay ? daysBetween(record.visits.lastDay, today) : 0
  return { ...record, visits: { lastDay: today, gapDays } }
}

/** How long the person had been away when today began; 0 on any other day. */
export function awayDaysOn(record: ChapterRecord, today: string): number {
  return record.visits.lastDay === today ? record.visits.gapDays : 0
}

export interface ChapterDoors {
  /** The full Bugün board, everything under the nutrition card. */
  board: boolean
  /** The quest and league rows. */
  trail: boolean
  /** The Afi row. */
  chat: boolean
  /** The Vücudum row. */
  body: boolean
  /** The Menüm door. */
  menu: boolean
  /** The Grubum door. */
  circle: boolean
}

const EVERY_DOOR: ChapterDoors = {
  board: true,
  trail: true,
  chat: true,
  body: true,
  menu: true,
  circle: true,
}

/**
 * Which doors of the Bugün board stand open.
 *
 * Every gate carries a safety valve on the day count, and that is not a
 * detail: a door held shut by a chapter nobody ever finished would be a
 * feature deleted by accident. Waving a chapter away costs at most a day of
 * waiting, never the thing itself.
 */
/**
 * How the board opens: chapter by chapter, or all at once.
 *
 * "open" is the remote switch (afiet.co/api/app-version, `flags.ftueDoors`):
 * the chapters keep teaching, but no row waits for its chapter. It exists so a
 * bad reading of the staged board can be undone from the web without a
 * release.
 */
export type DoorMode = 'progressive' | 'open'

export function chapterDoors(
  record: ChapterRecord,
  signals: ChapterSignals,
  mode: DoorMode = 'progressive',
): ChapterDoors {
  if (record.established || mode === 'open') return EVERY_DOOR
  const days = signals.loggedDays
  return {
    board: isSettled(record, 'closeDay') || days >= BOARD_SAFETY_DAYS,
    trail: isSettled(record, 'trail') || days >= TRAIL_SAFETY_DAYS,
    chat: isSettled(record, 'team') || days >= CHAT_SAFETY_DAYS,
    /* A door also opens the moment the room behind it stops being empty,
       whether or not the chapter got there first. */
    body: isSettled(record, 'direction') || signals.hasBodyProfile || days >= DOOR_SAFETY_DAYS,
    menu: isSettled(record, 'menu') || signals.hasSofra || days >= DOOR_SAFETY_DAYS,
    circle:
      isSettled(record, 'circle') ||
      signals.hasGroup ||
      record.invited ||
      days >= DOOR_SAFETY_DAYS,
  }
}

/**
 * True once no built chapter can ever ask for anything again.
 *
 * The screen uses this to stop querying: a finished guide that keeps a live
 * query mounted is a tax every account pays forever for two days of use.
 */
export function allChaptersSettled(record: ChapterRecord): boolean {
  return BUILT_CHAPTERS.every((key) => chapterSettled(record, key))
}

/** True once this one chapter can never ask for anything again. */
export function chapterSettled(record: ChapterRecord, key: ChapterKey): boolean {
  if (teachingRetired(record) && !REWARD_CHAPTERS.includes(key)) return true
  const entry = chapterEntry(record, key)
  return entry.state === 'done' || entry.state === 'passed' || entry.offers >= OFFER_LIMIT
}
