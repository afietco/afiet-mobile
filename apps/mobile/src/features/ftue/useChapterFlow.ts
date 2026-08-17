import { useEffect } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import type { ApiQuest } from '@/data/api/client'
import { mealRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useGroups } from '@/features/groups/useGroups'
import type { SofraDraft } from '@/features/nutrition/sofra'
import { questSections } from '@/features/progress/quests'
import { track } from '@/lib/track'
import {
  alreadyDone,
  awayDaysOn,
  chapterDoors,
  chapterEntry,
  chapterSettled,
  EMPTY_RECORD,
  isSettled,
  pickChapter,
  type ChapterDoors,
  type ChapterKey,
  type ChapterSignals,
} from './chapters'
import {
  clearForcedChapter,
  ensureChapterBackfill,
  markChapterDismissed,
  markChapterDone,
  markChapterOpened,
  noteVisit,
  useChapterSnapshot,
} from './chapter-store'
import { useFtueSeen } from './ftueFlags'
import { REPEAT_HISTORY_DAYS, repeatedFoods, sofraDraftFromRepeats } from './repeats'

/**
 * The running FTUE: which chapter is on screen, and which doors it has opened.
 *
 * Everything it needs about the day is handed in by Bugün, which already
 * queries all of it: no live query is mounted twice for the sake of the guide.
 * The exceptions are the queries a chapter alone needs, the quest list for the
 * reward and the meal history for the sofra, and each is gated on its own
 * chapter still having something to say, so a finished account pays nothing
 * for either.
 */

export interface ChapterFlow {
  /** The chapter to draw right now, if any. */
  current: ChapterKey | null
  doors: ChapterDoors
  /** The quest behind the trail chapter, once there is one. */
  claimable: ApiQuest | null
  /** The sofra the menu chapter offers, built from what repeats. */
  sofraDraft: SofraDraft | null
  /** Whether the account is already in a group; the social chapter reads it. */
  hasGroup: boolean
  /** True while the chapter on screen was asked for again from the guide. */
  replaying: boolean
  complete: (key: ChapterKey) => void
  dismiss: (key: ChapterKey) => void
}

interface ChapterFlowInput {
  profileId: number
  /** Local YYYY-MM-DD, the same date the screen is drawing. */
  date: string
  /** Undefined until the meal history has loaded. */
  loggedDays: number | undefined
  mealsToday: number | undefined
  /** Undefined until the day summary has loaded. */
  unknownToday: boolean | undefined
  hasBodyProfile: boolean
}

const QUEST_TABLES = ['meals', 'water', 'measurements', 'customFoods', 'profiles', 'groups'] as const

/** The chapters that mark themselves done when the person has done the thing. */
const SELF_COMPLETING: readonly ChapterKey[] = ['direction', 'circle', 'menu']

function shiftDay(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`)
  if (!Number.isFinite(time)) return date
  return new Date(time + days * 86_400_000).toISOString().slice(0, 10)
}

export function useChapterFlow({
  profileId,
  date,
  loggedDays,
  mealsToday,
  unknownToday,
  hasBodyProfile,
}: ChapterFlowInput): ChapterFlow {
  const { hydrated, record } = useChapterSnapshot()

  /* What the guided tour this replaces left behind. Any of them means the
     account has been here before, whatever its meal history looks like.

     One call per line, never joined with `||` in a single expression: these
     are hooks, and a boolean chain stops calling them as soon as one is true,
     which changes the hook count between renders. An account that carries the
     first flag crashed the whole screen on the render its flags landed. */
  const guideStarted = useFtueSeen('afiGuideStarted')
  const guideDone = useFtueSeen('afiGuideDone')
  const starterShown = useFtueSeen('starterShown')
  const rhythmExplained = useFtueSeen('rhythmExplained')
  const chatVisited = useFtueSeen('sohbetVisited')
  const legacyGuideTouched = guideStarted || guideDone || starterShown

  useEffect(() => {
    if (!hydrated || record !== null || loggedDays === undefined) return
    ensureChapterBackfill({ loggedDays, hasBodyProfile, legacyGuideTouched, rhythmExplained })
  }, [hasBodyProfile, hydrated, legacyGuideTouched, loggedDays, record, rhythmExplained])

  /* Today's visit is written once the record exists, and the gap it measures
     stays readable for the rest of the day (chapters.ts, recordVisit). */
  useEffect(() => {
    if (!hydrated || record === null) return
    if (record.visits.lastDay !== date) noteVisit(date)
  }, [date, hydrated, record])

  /* The reward chapter is the only one that needs the quest list, so it is
     the only one that is allowed to reach for it, and only while it still
     might fire. `settled` is true for every account that has finished it. */
  const settled = record === null || chapterSettled(record, 'trail')
  const claimable = useLiveValue<ApiQuest | null>(
    [...QUEST_TABLES],
    async () => {
      if (settled) return null
      try {
        return questSections(await requireApi().getQuests()).claimable[0] ?? null
      } catch {
        // A quest list we cannot read simply means no reward is offered today.
        return null
      }
    },
    [settled],
  )

  /* The sofra chapter reads the last month of meals for a food that repeats,
     and stops reading the day the chapter is settled or a sofra exists. */
  const menuSettled = record === null || chapterSettled(record, 'menu')
  const sofraCount = useLiveValue<number>(
    ['sofras'],
    async () => {
      if (menuSettled) return 0
      try {
        return (await requireApi().listSofras()).length
      } catch {
        return 0
      }
    },
    [menuSettled],
  )
  const hasSofra = (sofraCount ?? 0) > 0
  const repeatQueryOff = menuSettled || hasSofra || (loggedDays ?? 0) < 2
  const repeats = useLiveValue(
    ['meals'],
    async () => {
      if (repeatQueryOff) return []
      try {
        const from = shiftDay(date, -REPEAT_HISTORY_DAYS)
        return repeatedFoods(await mealRepo.forRange(profileId, from, date))
      } catch {
        return []
      }
    },
    [repeatQueryOff, profileId, date],
  )
  const sofraDraft = repeats && repeats.length > 0 ? sofraDraftFromRepeats(repeats) : null

  /* One group at most, and the store is shared with the board's own door, so
     this mounts no request the screen was not already making. */
  const { state: groupsState } = useGroups()
  const hasGroup = groupsState.status === 'ready' && groupsState.groups.length > 0

  const signals: ChapterSignals = {
    loggedDays: loggedDays ?? 0,
    mealsToday: mealsToday ?? 0,
    claimableQuests: claimable ? 1 : 0,
    hour: new Date().getHours(),
    today: date,
    hasBodyProfile,
    hasGroup,
    hasSofra,
    repeatedFoods: repeats?.length ?? 0,
    unknownToday: unknownToday ?? false,
    chatVisited,
    awayDays: record ? awayDaysOn(record, date) : 0,
  }

  /* Law 7 at runtime: a chapter whose lesson has already been carried out
     goes on the table without being taught. */
  const groupsKnown = groupsState.status !== 'loading'
  useEffect(() => {
    if (!hydrated || record === null || !groupsKnown) return
    const done = { hasBodyProfile, hasGroup, hasSofra }
    for (const key of SELF_COMPLETING) {
      if (!isSettled(record, key) && alreadyDone(key, done)) markChapterDone(key)
    }
  }, [groupsKnown, hasBodyProfile, hasGroup, hasSofra, hydrated, record])

  const loading =
    !hydrated ||
    loggedDays === undefined ||
    mealsToday === undefined ||
    unknownToday === undefined ||
    groupsState.status === 'loading'
  const picked = loading || record === null ? null : pickChapter(record, signals)
  /* Asked for again from the guide. A replay is always drawn: the two chapters
     that normally wait for something (a reward, a repeated food) fall back to
     pointing at the door they open, so "tekrar göster" never shows nothing. */
  const replaying = picked !== null && record?.forced === picked
  /* Outside a replay, a chapter with nothing to draw is not drawn, and the
     queue never reaches it in that state; the guard stays for the record a
     replay leaves behind, so a forced key can never pin the queue. */
  const undrawable =
    !replaying &&
    ((picked === 'trail' && !claimable) || (picked === 'menu' && sofraDraft === null))
  const current = undrawable ? null : picked

  useEffect(() => {
    if (undrawable) clearForcedChapter()
  }, [undrawable])

  useEffect(() => {
    if (!current) return
    const entry = chapterEntry(record ?? EMPTY_RECORD, current)
    if (entry.state === 'showing' && entry.day === date) return
    markChapterOpened(current, date)
    track('afi_guide_step_shown', { step: current })
  }, [current, date, record])

  return {
    current,
    /* No record yet means an account that predates this system: its record is
       written by the backfill a moment from now, and until then every door
       stands open. A new account never passes through here, because answering
       "Sofranda kim var?" during onboarding writes its record first. Guessing
       the other way would blank the board of an established account for a
       frame on the launch it updates. */
    doors:
      record === null
        ? { board: true, trail: true, chat: true, body: true, menu: true, circle: true }
        : chapterDoors(record, signals),
    claimable: claimable ?? null,
    sofraDraft,
    hasGroup,
    replaying,
    complete: (key: ChapterKey) => {
      markChapterDone(key)
      track('afi_guide_completed', { step: key })
    },
    dismiss: (key: ChapterKey) => {
      markChapterDismissed(key)
      track('afi_guide_ended', { step: key, reason: 'skipped' })
    },
  }
}
