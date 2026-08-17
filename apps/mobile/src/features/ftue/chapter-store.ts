import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSyncExternalStore } from 'react'
import {
  backfillChapters,
  completeChapter,
  dismissChapter,
  EMPTY_RECORD,
  forceChapter,
  markInvited,
  openChapter,
  recordVisit,
  retireTeaching,
  reviewerRecord,
  type BackfillSignals,
  type ChapterKey,
  type ChapterRecord,
  type TableAnswer,
} from './chapters'

/**
 * Where the chapter record lives, per account, on the device.
 *
 * It is deliberately the same shape of store as ftueFlags: hydrated behind the
 * splash when a session is restored, cleared when one ends, and never crossing
 * an account boundary. The FTUE is the one thing that must never leak between
 * two people sharing a phone, because being taught somebody else's lesson is
 * indistinguishable from the app being broken.
 *
 * Nothing here talks to the network. A person who is offline on their first
 * day still gets their first day.
 */

const ACCOUNT_PREFIX = 'fh:ftue:account:'
const RECORD_SUFFIX = ':chapters'

/**
 * Accounts that are never taught: the store review demo account, on the prod
 * Stack project. A reviewer opens every screen in one sitting, so for them the
 * table is laid before they arrive and every board row is there from the
 * first frame. Nothing is persisted for these accounts; the record is made up
 * on every load.
 */
const REVIEWER_ACCOUNT_IDS = new Set<string>(['af906e25-5d7e-4e26-9d73-6fb4542d70ee'])

export interface ChapterSnapshot {
  /** False until the stored record has been read for the active account. */
  hydrated: boolean
  /** Null once hydrated means the account has never had a record written. */
  record: ChapterRecord | null
}

const EMPTY_SNAPSHOT: ChapterSnapshot = { hydrated: false, record: null }

let snapshot: ChapterSnapshot = EMPTY_SNAPSHOT
let activeAccountId: string | null = null
let generation = 0
let writeQueue: Promise<void> = Promise.resolve()
const listeners = new Set<() => void>()

function emit(next: ChapterSnapshot) {
  snapshot = next
  listeners.forEach((listener) => listener())
}

function storageKey(accountId: string): string {
  return `${ACCOUNT_PREFIX}${encodeURIComponent(accountId)}${RECORD_SUFFIX}`
}

function parseRecord(raw: string): ChapterRecord | null {
  try {
    const value = JSON.parse(raw) as Partial<ChapterRecord>
    if (value.version !== 1 || typeof value.entries !== 'object' || value.entries === null) {
      return null
    }
    return {
      version: 1,
      entries: value.entries,
      table: value.table ?? null,
      forced: value.forced ?? null,
      invited: value.invited === true,
      established: value.established === true,
      visits: {
        lastDay: typeof value.visits?.lastDay === 'string' ? value.visits.lastDay : null,
        gapDays: typeof value.visits?.gapDays === 'number' ? value.visits.gapDays : 0,
      },
    }
  } catch {
    return null
  }
}

function persist(accountId: string, record: ChapterRecord) {
  if (REVIEWER_ACCOUNT_IDS.has(accountId)) return
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => AsyncStorage.setItem(storageKey(accountId), JSON.stringify(record)))
    .catch(() => {
      // A lost write costs at most one repeated chapter, never a broken screen.
    })
}

/** Switches the in-memory record to one authenticated account. */
export async function loadChapters(accountId: string): Promise<void> {
  const current = ++generation
  activeAccountId = accountId
  emit(EMPTY_SNAPSHOT)
  if (REVIEWER_ACCOUNT_IDS.has(accountId)) {
    emit({ hydrated: true, record: reviewerRecord() })
    return
  }
  let record: ChapterRecord | null = null
  try {
    const raw = await AsyncStorage.getItem(storageKey(accountId))
    record = raw ? parseRecord(raw) : null
  } catch {
    // An unreadable record starts the account over rather than leaking another.
  }
  if (current !== generation || activeAccountId !== accountId) return
  emit({ hydrated: true, record })
}

/** Clears the active account before another session starts. */
export async function resetChapters(): Promise<void> {
  const accountId = activeAccountId
  generation += 1
  activeAccountId = null
  emit(EMPTY_SNAPSHOT)
  if (!accountId) return
  try {
    await AsyncStorage.removeItem(storageKey(accountId))
  } catch {
    // Best effort: the next sign-in overwrites it anyway.
  }
}

function update(change: (record: ChapterRecord) => ChapterRecord): void {
  const accountId = activeAccountId
  if (!accountId || !snapshot.hydrated) return
  const next = change(snapshot.record ?? EMPTY_RECORD)
  if (next === snapshot.record) return
  emit({ hydrated: true, record: next })
  persist(accountId, next)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useChapterSnapshot(): ChapterSnapshot {
  return useSyncExternalStore(subscribe, () => snapshot)
}

/**
 * Fills a record in from what the account already has, once and only once.
 *
 * It runs on the first launch of this system for an account that has never
 * had a record, which is exactly where an established account would otherwise
 * be handed a first-day tour over three weeks of history.
 */
export function ensureChapterBackfill(signals: BackfillSignals): void {
  if (!snapshot.hydrated || snapshot.record !== null) return
  const accountId = activeAccountId
  if (!accountId) return
  const record = backfillChapters(signals)
  emit({ hydrated: true, record })
  persist(accountId, record)
}

export function markChapterOpened(key: ChapterKey, today: string): void {
  update((record) => openChapter(record, key, today))
}

export function markChapterDone(key: ChapterKey): void {
  update((record) => completeChapter(record, key))
}

export function markChapterDismissed(key: ChapterKey): void {
  update((record) => dismissChapter(record, key))
}

export function replayChapter(key: ChapterKey): void {
  update((record) => forceChapter(record, key))
}

/** Every open lesson ends now; the reward and the replays stay. */
export function stopTeaching(): void {
  update(retireTeaching)
}

/**
 * Drops a replay that cannot be drawn.
 *
 * Asking to see the reward chapter again when there is no reward waiting would
 * otherwise pin the queue to a chapter that renders nothing: the guide would
 * go silent for good, and the only visible symptom would be chapters that
 * stopped arriving.
 */
export function clearForcedChapter(): void {
  update((record) => (record.forced === null ? record : { ...record, forced: null }))
}

/** The answer to "Sofranda kim var?", stored with the chapters it reorders. */
export function setTableAnswer(answer: TableAnswer): void {
  update((record) => (record.table === answer ? record : { ...record, table: answer }))
}

/**
 * The account arrived through a group invitation, so the social chapter goes
 * first and the group door is open from the start. Written during onboarding
 * in place of the table answer, which is not asked of somebody whose table
 * already has people at it.
 */
export function markInvitedAccount(): void {
  update(markInvited)
}

/** Notes today's visit to Bugün; the first call of a day measures the gap. */
export function noteVisit(today: string): void {
  update((record) => recordVisit(record, today))
}
