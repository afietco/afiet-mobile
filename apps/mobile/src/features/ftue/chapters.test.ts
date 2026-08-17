import { describe, expect, it } from 'vitest'
import {
  allChaptersSettled,
  alreadyDone,
  awayDaysOn,
  backfillChapters,
  chapterDoors,
  chapterReady,
  chapterSettled,
  completeChapter,
  daysBetween,
  dismissChapter,
  EMPTY_RECORD,
  forceChapter,
  markInvited,
  nextChapterCue,
  openChapter,
  pickChapter,
  recordVisit,
  retireTeaching,
  reviewerRecord,
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
    hasBodyProfile: false,
    hasGroup: false,
    hasSofra: false,
    repeatedFoods: 0,
    unknownToday: false,
    chatVisited: false,
    awayDays: 0,
    ...overrides,
  }
}

/** The first three chapters done, the way a second-week account looks. */
function spineDone(): ChapterRecord {
  let record: ChapterRecord = EMPTY_RECORD
  for (const key of ['balance', 'closeDay', 'rhythm'] as const) record = completeChapter(record, key)
  return record
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

  it('offers the sofra the moment a food repeats, and never once one exists', () => {
    expect(chapterReady('menu', EMPTY_RECORD, signals({ loggedDays: 3 }))).toBe(false)
    expect(chapterReady('menu', EMPTY_RECORD, signals({ loggedDays: 3, repeatedFoods: 1 }))).toBe(
      true,
    )
    expect(
      chapterReady('menu', EMPTY_RECORD, signals({ repeatedFoods: 2, hasSofra: true })),
    ).toBe(false)
  })

  it('asks the direction by the fifth day, and never of a body already on file', () => {
    expect(chapterReady('direction', EMPTY_RECORD, signals({ loggedDays: 4 }))).toBe(false)
    expect(chapterReady('direction', EMPTY_RECORD, signals({ loggedDays: 5 }))).toBe(true)
    expect(
      chapterReady('direction', EMPTY_RECORD, signals({ loggedDays: 9, hasBodyProfile: true })),
    ).toBe(false)
  })

  it('times the social chapter by who else eats at the table', () => {
    const solo = { ...EMPTY_RECORD, table: 'solo' as const }
    const partner = { ...EMPTY_RECORD, table: 'partner' as const }
    const family = { ...EMPTY_RECORD, table: 'family' as const }
    expect(chapterReady('circle', family, signals({ loggedDays: 2 }))).toBe(true)
    expect(chapterReady('circle', partner, signals({ loggedDays: 2 }))).toBe(false)
    expect(chapterReady('circle', partner, signals({ loggedDays: 3 }))).toBe(true)
    expect(chapterReady('circle', solo, signals({ loggedDays: 4 }))).toBe(false)
    // A rhythm week is five afiyet days; an unanswered table waits like a solo one.
    expect(chapterReady('circle', solo, signals({ loggedDays: 5 }))).toBe(true)
    expect(chapterReady('circle', EMPTY_RECORD, signals({ loggedDays: 5 }))).toBe(true)
  })

  it('brings the social chapter on day zero to somebody who was invited', () => {
    const invited = markInvited(EMPTY_RECORD)
    expect(chapterReady('circle', invited, signals())).toBe(true)
    // ...and drops it once they are in the group.
    expect(chapterReady('circle', invited, signals({ hasGroup: true }))).toBe(false)
  })

  it('introduces the team on an unknown food, a chat visit, or the fourth day', () => {
    expect(chapterReady('team', EMPTY_RECORD, signals({ loggedDays: 1 }))).toBe(false)
    expect(chapterReady('team', EMPTY_RECORD, signals({ loggedDays: 1, unknownToday: true }))).toBe(
      true,
    )
    expect(chapterReady('team', EMPTY_RECORD, signals({ loggedDays: 1, chatVisited: true }))).toBe(
      true,
    )
    expect(chapterReady('team', EMPTY_RECORD, signals({ loggedDays: 4 }))).toBe(true)
  })

  it('welcomes a return only after three days away', () => {
    expect(chapterReady('remind', EMPTY_RECORD, signals({ loggedDays: 3, awayDays: 2 }))).toBe(
      false,
    )
    expect(chapterReady('remind', EMPTY_RECORD, signals({ loggedDays: 3, awayDays: 3 }))).toBe(
      true,
    )
    // Nobody is welcomed back to a table they never sat at.
    expect(chapterReady('remind', EMPTY_RECORD, signals({ loggedDays: 0, awayDays: 9 }))).toBe(
      false,
    )
  })
})

describe('the day of the return', () => {
  it('measures the gap once, on the first visit of the day', () => {
    const first = recordVisit(EMPTY_RECORD, '2026-08-01')
    expect(first.visits).toEqual({ lastDay: '2026-08-01', gapDays: 0 })
    const back = recordVisit(first, '2026-08-05')
    expect(back.visits).toEqual({ lastDay: '2026-08-05', gapDays: 4 })
    // A second visit the same day changes nothing.
    expect(recordVisit(back, '2026-08-05')).toBe(back)
  })

  it('reads the gap on the day of the return and on no other day', () => {
    const back = recordVisit(recordVisit(EMPTY_RECORD, '2026-08-01'), '2026-08-05')
    expect(awayDaysOn(back, '2026-08-05')).toBe(4)
    expect(awayDaysOn(back, '2026-08-06')).toBe(0)
    expect(daysBetween('2026-08-31', '2026-09-02')).toBe(2)
  })

  it('lets the return speak before any lesson that is also ready', () => {
    const record = spineDone()
    const returning = signals({ loggedDays: 6, awayDays: 4, repeatedFoods: 2, today: '2026-08-20' })
    expect(pickChapter(record, returning)).toBe('remind')
  })

  it('lets the invited person hear about their table before the first lesson', () => {
    const invited = markInvited(EMPTY_RECORD)
    expect(pickChapter(invited, FIRST_MEAL)).toBe('circle')
    expect(pickChapter(EMPTY_RECORD, FIRST_MEAL)).toBe('balance')
  })
})

describe('what was already done', () => {
  it('counts a body on file, a group and a sofra as chapters carried out', () => {
    expect(alreadyDone('direction', { hasBodyProfile: true, hasGroup: false, hasSofra: false })).toBe(
      true,
    )
    expect(alreadyDone('circle', { hasBodyProfile: false, hasGroup: true, hasSofra: false })).toBe(
      true,
    )
    expect(alreadyDone('menu', { hasBodyProfile: false, hasGroup: false, hasSofra: true })).toBe(true)
    expect(alreadyDone('team', { hasBodyProfile: true, hasGroup: true, hasSofra: true })).toBe(false)
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
    /* The spine is behind them, and every room that already has something in
       it is skipped. What is left is the one introduction nobody has had yet,
       the team, and it comes once and then the guide is quiet. */
    const rooms = signals({
      loggedDays: 21,
      mealsToday: 2,
      hour: 20,
      hasBodyProfile: true,
      hasGroup: true,
      hasSofra: true,
    })
    expect(pickChapter(record, rooms)).toBe('team')
    expect(pickChapter(completeChapter(record, 'team'), rooms)).toBe(null)
  })

  it('still hands an established account the reward it has earned', () => {
    const record = backfillChapters({
      loggedDays: 21,
      hasBodyProfile: true,
      legacyGuideTouched: true,
      rhythmExplained: false,
    })
    // Ahead of every lesson still owed to them, including the social one.
    const withQuest = signals({
      loggedDays: 21,
      mealsToday: 1,
      claimableQuests: 1,
      hour: 20,
      hasBodyProfile: true,
    })
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

  it('opens each new door with its chapter, with the room, or with the days', () => {
    const early = signals({ loggedDays: 2 })
    expect(chapterDoors(EMPTY_RECORD, early)).toMatchObject({
      chat: false,
      body: false,
      menu: false,
      circle: false,
    })
    expect(chapterDoors(completeChapter(EMPTY_RECORD, 'team'), early).chat).toBe(true)
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 3 })).chat).toBe(true)
    expect(chapterDoors(EMPTY_RECORD, { ...early, hasBodyProfile: true }).body).toBe(true)
    expect(chapterDoors(EMPTY_RECORD, { ...early, hasSofra: true }).menu).toBe(true)
    expect(chapterDoors(EMPTY_RECORD, { ...early, hasGroup: true }).circle).toBe(true)
    expect(chapterDoors(markInvited(EMPTY_RECORD), early).circle).toBe(true)
    expect(chapterDoors(EMPTY_RECORD, signals({ loggedDays: 5 }))).toMatchObject({
      body: true,
      menu: true,
      circle: true,
    })
  })

  it('hides nothing from an account that was here before this system', () => {
    const established = backfillChapters({
      loggedDays: 21,
      hasBodyProfile: false,
      legacyGuideTouched: true,
      rhythmExplained: false,
    })
    expect(established.established).toBe(true)
    expect(chapterDoors(established, signals({ loggedDays: 21 }))).toEqual({
      board: true,
      trail: true,
      chat: true,
      body: true,
      menu: true,
      circle: true,
    })
  })
})

describe('stopping the lessons from the guide', () => {
  it('ends every open lesson at once, keeps the reward, and stays replayable', () => {
    const record = retireTeaching(completeChapter(EMPTY_RECORD, 'balance'))
    expect(record.entries.balance?.state).toBe('done')
    expect(record.entries.menu?.state).toBe('passed')
    expect(record.entries.remind?.state).toBe('passed')
    expect(record.entries.trail).toBeUndefined()

    const later = signals({ loggedDays: 6, mealsToday: 2, hour: 20, repeatedFoods: 2 })
    expect(pickChapter(record, later)).toBe(null)
    expect(pickChapter(record, { ...later, claimableQuests: 1 })).toBe('trail')
    expect(pickChapter(forceChapter(record, 'menu'), later)).toBe('menu')
  })

  it('changes nothing when there is nothing left to stop', () => {
    const quiet = retireTeaching(EMPTY_RECORD)
    expect(retireTeaching(quiet)).toBe(quiet)
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
    for (const key of [
      'balance',
      'closeDay',
      'rhythm',
      'menu',
      'direction',
      'circle',
      'trail',
      'team',
      'remind',
    ] as const) {
      record = completeChapter(record, key)
    }
    expect(allChaptersSettled(record)).toBe(true)
    expect(allChaptersSettled(EMPTY_RECORD)).toBe(false)
  })

  it('settles one chapter at a time, so each query can stop on its own', () => {
    const record = completeChapter(EMPTY_RECORD, 'trail')
    expect(chapterSettled(record, 'trail')).toBe(true)
    expect(chapterSettled(record, 'menu')).toBe(false)
    // "Stop teaching me" settles every lesson but never the reward.
    expect(chapterSettled(refusedTwice('balance'), 'menu')).toBe(true)
    expect(chapterSettled(refusedTwice('balance'), 'trail')).toBe(false)
  })
})

describe('the remote door switch and the reviewer', () => {
  it('opens every door at once when the switch says so, and teaches on', () => {
    const early = signals({ loggedDays: 1 })
    expect(chapterDoors(EMPTY_RECORD, early, 'progressive').board).toBe(false)
    expect(chapterDoors(EMPTY_RECORD, early, 'open')).toEqual({
      board: true,
      trail: true,
      chat: true,
      body: true,
      menu: true,
      circle: true,
    })
    expect(pickChapter(EMPTY_RECORD, FIRST_MEAL)).toBe('balance')
  })

  it('hands the reviewer a table already laid', () => {
    const record = reviewerRecord()
    expect(allChaptersSettled(record)).toBe(true)
    expect(record.established).toBe(true)
    expect(pickChapter(record, signals({ loggedDays: 3, claimableQuests: 1 }))).toBe(null)
    expect(chapterDoors(record, signals({ loggedDays: 0 })).circle).toBe(true)
  })
})

describe('the cue the app schedules for itself', () => {
  it('points at this evening once the first chapter is behind the person', () => {
    const record = completeChapter(EMPTY_RECORD, 'balance')
    const noon = signals({ loggedDays: 1, mealsToday: 1, hour: 12 })
    expect(nextChapterCue(record, noon)?.chapter).toBe('closeDay')
    expect(nextChapterCue(record, noon)?.when).toBe('evening')
    // Not once the evening has come, and not without a meal to close on.
    expect(nextChapterCue(record, { ...noon, hour: 19 })).toBe(null)
    expect(nextChapterCue(record, { ...noon, mealsToday: 0 })).toBe(null)
  })

  it("names tomorrow's chapter when today's door has already been opened", () => {
    const today = completeChapter(openChapter(spineDone(), 'trail', TODAY), 'trail')
    const evening = signals({ loggedDays: 6, mealsToday: 2, hour: 20, repeatedFoods: 1 })
    const cue = nextChapterCue(today, evening)
    expect(cue?.when).toBe('morning')
    expect(cue?.chapter).toBe('menu')
    expect(cue?.body).toContain('Sofranı tanı')
  })

  it('promises nothing it cannot keep and nothing to somebody who stopped the lessons', () => {
    // No door opened today: whatever is ready shows now, so there is no cue.
    expect(nextChapterCue(spineDone(), signals({ loggedDays: 6, hour: 20, repeatedFoods: 1 }))).toBe(
      null,
    )
    // The closing cannot be promised for a morning.
    const opened = openChapter(completeChapter(EMPTY_RECORD, 'balance'), 'trail', TODAY)
    expect(nextChapterCue(opened, signals({ loggedDays: 1, mealsToday: 1, hour: 20 }))).toBe(null)
    expect(nextChapterCue(retireTeaching(EMPTY_RECORD), signals({ loggedDays: 1, mealsToday: 1 }))).toBe(
      null,
    )
  })
})
