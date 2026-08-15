import { describe, expect, it } from 'vitest'
import {
  allChaptersSettled,
  backfillChapters,
  chapterDoors,
  chapterReady,
  completeChapter,
  dismissChapter,
  EMPTY_RECORD,
  forceChapter,
  openChapter,
  pickChapter,
  type ChapterRecord,
  type ChapterSignals,
} from './chapters'

const TODAY = '2026-08-15'
const TOMORROW = '2026-08-16'

function signals(overrides: Partial<ChapterSignals> = {}): ChapterSignals {
  return {
    loggedDays: 0,
    mealsToday: 0,
    claimableQuests: 0,
    hour: 12,
    today: TODAY,
    ...overrides,
  }
}

/** Offered, waved away, offered once more the next day and waved away again. */
function refusedTwice(key: 'balance'): ChapterRecord {
  const once = dismissChapter(openChapter(EMPTY_RECORD, key, TODAY), key)
  return dismissChapter(openChapter(once, key, TOMORROW), key)
}

/** The state a brand new account is in the first time it reaches Bugün. */
const FIRST_MEAL = signals({ loggedDays: 1, mealsToday: 1, hour: 21 })

describe('chapter readiness', () => {
  it('waits for a record of the person before opening the first door', () => {
    expect(chapterReady('balance', EMPTY_RECORD, signals())).toBe(false)
    expect(chapterReady('balance', EMPTY_RECORD, FIRST_MEAL)).toBe(true)
  })

  it('keeps the closing for the evening, and only after the first door', () => {
    const morning = signals({ loggedDays: 1, mealsToday: 1, hour: 9 })
    const evening = signals({ loggedDays: 1, mealsToday: 1, hour: 19 })
    const opened = completeChapter(EMPTY_RECORD, 'balance')

    expect(chapterReady('closeDay', EMPTY_RECORD, evening)).toBe(false)
    expect(chapterReady('closeDay', opened, morning)).toBe(false)
    expect(chapterReady('closeDay', opened, evening)).toBe(true)
  })

  it('opens the rhythm on the second afiyet day', () => {
    const record = completeChapter(completeChapter(EMPTY_RECORD, 'balance'), 'closeDay')
    expect(chapterReady('rhythm', record, signals({ loggedDays: 1 }))).toBe(false)
    expect(chapterReady('rhythm', record, signals({ loggedDays: 2 }))).toBe(true)
  })

  it('lets the reward through even when everything else was waved away', () => {
    expect(chapterReady('trail', refusedTwice('balance'), signals({ claimableQuests: 1 }))).toBe(
      true,
    )
  })

  it('never picks a chapter that is designed but not built', () => {
    const record = completeChapter(EMPTY_RECORD, 'balance')
    expect(chapterReady('menu', record, signals({ loggedDays: 9 }))).toBe(false)
    expect(chapterReady('circle', record, signals({ loggedDays: 9 }))).toBe(false)
  })
})

describe('one door a day', () => {
  it('offers the first chapter to a new account and nothing else that day', () => {
    const picked = pickChapter(EMPTY_RECORD, FIRST_MEAL)
    expect(picked).toBe('balance')

    const shown = openChapter(EMPTY_RECORD, 'balance', TODAY)
    const done = completeChapter(shown, 'balance')
    // The evening arrives, the closing is ready, and it still waits its turn.
    expect(chapterReady('closeDay', done, FIRST_MEAL)).toBe(true)
    expect(pickChapter(done, FIRST_MEAL)).toBe(null)
  })

  it('hands the floor to the next chapter tomorrow', () => {
    const done = completeChapter(openChapter(EMPTY_RECORD, 'balance', TODAY), 'balance')
    const evening = signals({ loggedDays: 1, mealsToday: 1, hour: 19, today: TOMORROW })
    expect(pickChapter(done, evening)).toBe('closeDay')
  })

  it('keeps showing the chapter that is already on screen today', () => {
    const shown = openChapter(EMPTY_RECORD, 'balance', TODAY)
    expect(pickChapter(shown, FIRST_MEAL)).toBe('balance')
  })

  it('says nothing more today once a chapter has been waved away', () => {
    const waved = dismissChapter(openChapter(EMPTY_RECORD, 'balance', TODAY), 'balance')
    expect(pickChapter(waved, FIRST_MEAL)).toBe(null)
  })
})

describe('taught once, reminded once, then quiet', () => {
  it('comes back exactly one more time and then retires itself', () => {
    const firstRefusal = dismissChapter(openChapter(EMPTY_RECORD, 'balance', TODAY), 'balance')
    const nextDay = signals({ loggedDays: 1, mealsToday: 1, hour: 21, today: TOMORROW })

    const reminded = pickChapter(firstRefusal, nextDay)
    expect(reminded).toBe('balance')

    const secondRefusal = dismissChapter(
      openChapter(firstRefusal, 'balance', TOMORROW),
      'balance',
    )
    expect(secondRefusal.entries.balance?.state).toBe('passed')
    expect(pickChapter(secondRefusal, signals({ ...nextDay, today: '2026-08-17' }))).toBe(null)
  })

  it('stops teaching altogether, rather than moving on to the next lesson', () => {
    // "Do not explain things to me" is one answer about one voice, not an
    // answer about one chapter, so the spine does not carry on without it.
    const laterEvening = signals({ loggedDays: 4, mealsToday: 2, hour: 20, today: '2026-08-20' })
    expect(pickChapter(refusedTwice('balance'), laterEvening)).toBe(null)
  })

  it('still hands over a reward to somebody who wants no lessons', () => {
    const earned = signals({ loggedDays: 5, mealsToday: 1, claimableQuests: 1, today: '2026-08-20' })
    expect(pickChapter(refusedTwice('balance'), earned)).toBe('trail')
  })

  it('never records a refusal as a failure', () => {
    const passed = refusedTwice('balance')
    expect(passed.entries.balance?.state).toBe('passed')
    expect(passed.entries.balance?.state).not.toBe('failed')
  })
})

describe('no window anywhere', () => {
  it('resumes a month later exactly where it stopped', () => {
    const started = openChapter(EMPTY_RECORD, 'balance', '2026-07-01')
    const muchLater = signals({ loggedDays: 1, mealsToday: 1, hour: 20, today: '2026-08-15' })
    expect(pickChapter(started, muchLater)).toBe('balance')
  })
})

describe('backfill', () => {
  it('leaves a brand new account with everything ahead of it', () => {
    const record = backfillChapters({
      loggedDays: 1,
      hasBodyProfile: false,
      legacyGuideTouched: false,
      rhythmExplained: false,
    })
    expect(record).toEqual(EMPTY_RECORD)
    expect(pickChapter(record, FIRST_MEAL)).toBe('balance')
  })

  it('teaches an account with a history nothing it already does', () => {
    const record = backfillChapters({
      loggedDays: 21,
      hasBodyProfile: true,
      legacyGuideTouched: true,
      rhythmExplained: true,
    })
    expect(pickChapter(record, signals({ loggedDays: 21, mealsToday: 2, hour: 20 }))).toBe(null)
  })

  it('still hands an established account the reward it has earned', () => {
    const record = backfillChapters({
      loggedDays: 21,
      hasBodyProfile: true,
      legacyGuideTouched: true,
      rhythmExplained: false,
    })
    const withQuest = signals({ loggedDays: 21, mealsToday: 1, claimableQuests: 1, hour: 20 })
    expect(pickChapter(record, withQuest)).toBe('trail')
  })

  it('reads a single logged day as a new account, not as a history', () => {
    // This is what the pre-account first meal leaves behind, so it must not
    // be mistaken for somebody who has been here before.
    const record = backfillChapters({
      loggedDays: 1,
      hasBodyProfile: false,
      legacyGuideTouched: false,
      rhythmExplained: false,
    })
    expect(record.entries.balance).toBeUndefined()
  })
})

describe('doors', () => {
  it('holds the board until the day has been closed once', () => {
    expect(chapterDoors(EMPTY_RECORD, FIRST_MEAL).board).toBe(false)
    const closed = completeChapter(EMPTY_RECORD, 'closeDay')
    expect(chapterDoors(closed, FIRST_MEAL).board).toBe(true)
  })

  it('opens the board on its own if the chapter never lands', () => {
    // A chapter waved away must cost a day of waiting at most, never a feature.
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 2 })).board).toBe(true)
  })

  it('opens the quest and league rows on their own by the first week', () => {
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 6 })).trail).toBe(false)
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 7 })).trail).toBe(true)
  })
})

describe('asking for a chapter again', () => {
  it('beats the queue and can be finished a second time', () => {
    const done = completeChapter(EMPTY_RECORD, 'balance')
    const forced = forceChapter(done, 'balance')
    expect(pickChapter(forced, signals())).toBe('balance')

    const finished = completeChapter(forced, 'balance')
    expect(finished.forced).toBe(null)
    expect(finished.entries.balance?.state).toBe('done')
  })

  it('clears itself when the replay is waved away too', () => {
    const forced = forceChapter(EMPTY_RECORD, 'rhythm')
    expect(dismissChapter(forced, 'rhythm').forced).toBe(null)
  })
})

describe('settling', () => {
  it('reports nothing left to ask once every chapter has ended', () => {
    let record: ChapterRecord = EMPTY_RECORD
    for (const key of ['balance', 'closeDay', 'rhythm', 'trail'] as const) {
      record = completeChapter(record, key)
    }
    expect(allChaptersSettled(record)).toBe(true)
    expect(allChaptersSettled(EMPTY_RECORD)).toBe(false)
  })
})
