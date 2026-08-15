import { useEffect } from 'react'
import { requireApi } from '@/data/api/apiHolder'
import type { ApiQuest } from '@/data/api/client'
import { useLiveValue } from '@/data/useLive'
import { questSections } from '@/features/progress/quests'
import { track } from '@/lib/track'
import {
  allChaptersSettled,
  chapterDoors,
  chapterEntry,
  EMPTY_RECORD,
  pickChapter,
  type ChapterDoors,
  type ChapterKey,
  type ChapterSignals,
} from './chapters'
import {
  ensureChapterBackfill,
  markChapterDismissed,
  markChapterDone,
  markChapterOpened,
  useChapterSnapshot,
} from './chapter-store'
import { useFtueSeen } from './ftueFlags'

/**
 * The running FTUE: which chapter is on screen, and which doors it has opened.
 *
 * Everything it needs about the day is handed in by Bugün, which already
 * queries all of it: no live query is mounted twice for the sake of the guide.
 * The single exception is the quest list, and it is gated on the guide still
 * having something to say, so a finished account pays nothing for it.
 */

export interface ChapterFlow {
  /** The chapter to draw right now, if any. */
  current: ChapterKey | null
  doors: ChapterDoors
  /** The quest behind the trail chapter, once there is one. */
  claimable: ApiQuest | null
  complete: (key: ChapterKey) => void
  dismiss: (key: ChapterKey) => void
}

interface ChapterFlowInput {
  /** Local YYYY-MM-DD, the same date the screen is drawing. */
  date: string
  /** Undefined until the meal history has loaded. */
  loggedDays: number | undefined
  mealsToday: number | undefined
  hasBodyProfile: boolean
}

const QUEST_TABLES = ['meals', 'water', 'measurements', 'customFoods', 'profiles', 'groups'] as const

export function useChapterFlow({
  date,
  loggedDays,
  mealsToday,
  hasBodyProfile,
}: ChapterFlowInput): ChapterFlow {
  const { hydrated, record } = useChapterSnapshot()

  /* What the guided tour this replaces left behind. Any of them means the
     account has been here before, whatever its meal history looks like. */
  const legacyGuideTouched =
    useFtueSeen('afiGuideStarted') || useFtueSeen('afiGuideDone') || useFtueSeen('starterShown')
  const rhythmExplained = useFtueSeen('rhythmExplained')

  useEffect(() => {
    if (!hydrated || record !== null || loggedDays === undefined) return
    ensureChapterBackfill({ loggedDays, hasBodyProfile, legacyGuideTouched, rhythmExplained })
  }, [hasBodyProfile, hydrated, legacyGuideTouched, loggedDays, record, rhythmExplained])

  /* The reward chapter is the only one that needs the network, so it is the
     only one that is allowed to reach for it, and only while it still might
     fire. `settled` is true for every account that has finished the guide. */
  const settled = record === null || allChaptersSettled(record)
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

  const signals: ChapterSignals = {
    loggedDays: loggedDays ?? 0,
    mealsToday: mealsToday ?? 0,
    claimableQuests: claimable ? 1 : 0,
    hour: new Date().getHours(),
    today: date,
  }

  const loading = !hydrated || loggedDays === undefined || mealsToday === undefined
  const current = loading || record === null ? null : pickChapter(record, signals)

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
    doors: record === null ? { board: true, trail: true } : chapterDoors(record, signals),
    claimable: claimable ?? null,
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
