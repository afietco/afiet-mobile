import {
  DEFAULT_GOAL_DIRECTION,
  addDays,
  fromISO,
  type GoalDirection,
  type GoalDirectionRow,
} from '@afiet/core'
import { widgetWeekStart } from '../widget/widgetFreshness'

/**
 * Pure rules of the dated direction log. No React, no repository, no clock:
 * every function receives the day it should reason about, so a past day can be
 * resolved as easily as today and no test has to wait for a Monday.
 */

/**
 * Direction of a user who has never chosen one, re-exported so the rules below
 * and the engine cannot drift apart on what the silent default is.
 */
export { DEFAULT_GOAL_DIRECTION }

/** A row that has been chosen but has not started yet. */
export interface PendingGoalDirection {
  direction: GoalDirection
  /** YYYY-MM-DD, the Monday it starts on */
  effectiveFrom: string
}

/**
 * The Monday after `today`. Kept because the log can still hold rows dated
 * that way from before the rule below changed, and reading them has to work.
 */
export function nextEffectiveFrom(today: string): string {
  return addDays(widgetWeekStart(fromISO(today)), 7)
}

/**
 * When a direction chosen on `today` actually starts. Always today.
 *
 * A later change used to wait for the coming Monday, to protect targets from
 * moving mid week under somebody already eating to them (docs/hedeflerim.md
 * section 7). Only the first choice landed at once. In practice that split the
 * screen against itself: the same five sentences, tapped the same way, did
 * something immediately for one person and something in four days for another,
 * and the only way to find out which was a line of small grey text. Somebody
 * who changes their mind about how they want to eat has changed their mind
 * today.
 *
 * The dated log is untouched, so the protection is still available if it is
 * ever wanted back: this is the one function that decides the date.
 */
export function effectiveFromFor(_rows: readonly GoalDirectionRow[], today: string): string {
  return today
}

/**
 * Log order: by start date, then by the moment of choice, then by id. Two rows
 * can share a start date when the user changes their mind before that Monday
 * arrives; the later choice wins.
 */
function compareRows(a: GoalDirectionRow, b: GoalDirectionRow): number {
  if (a.effectiveFrom !== b.effectiveFrom) return a.effectiveFrom < b.effectiveFrom ? -1 : 1
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
  return (a.id ?? 0) - (b.id ?? 0)
}

/** Rows are sorted defensively; callers must not depend on storage order. */
function sortRows(rows: readonly GoalDirectionRow[]): GoalDirectionRow[] {
  return [...rows].sort(compareRows)
}

/**
 * The read rule: the latest row whose effectiveFrom is not after `onDate`.
 * Returns undefined while only future rows exist (or none at all).
 */
export function activeDirectionRow(
  rows: readonly GoalDirectionRow[],
  onDate: string,
): GoalDirectionRow | undefined {
  const applicable = sortRows(rows).filter((row) => row.effectiveFrom <= onDate)
  return applicable[applicable.length - 1]
}

/**
 * The direction in force on `onDate`, falling back to the default. Passing a
 * past date answers "which direction was active then", which is what
 * calibration needs when it looks 14 days back.
 */
export function resolveDirection(
  rows: readonly GoalDirectionRow[],
  onDate: string,
): GoalDirection {
  return activeDirectionRow(rows, onDate)?.direction ?? DEFAULT_GOAL_DIRECTION
}

/**
 * The choice that is waiting to start: the last row dated after `onDate`.
 * Null when nothing is queued, or when the queued row repeats the direction
 * that is already active and would therefore announce a change that is none.
 */
export function pendingDirection(
  rows: readonly GoalDirectionRow[],
  onDate: string,
): PendingGoalDirection | null {
  const future = sortRows(rows).filter((row) => row.effectiveFrom > onDate)
  const last = future[future.length - 1]
  if (!last) return null
  if (last.direction === resolveDirection(rows, onDate)) return null
  return { direction: last.direction, effectiveFrom: last.effectiveFrom }
}

/**
 * The row a choice made on `today` appends. `createdAt` is supplied by the
 * caller so this stays free of the clock.
 */
export function buildDirectionRow(
  profileId: number,
  direction: GoalDirection,
  today: string,
  createdAt: string,
  /** The log so far; an empty one means this is the first choice. */
  rows: readonly GoalDirectionRow[] = [],
): Omit<GoalDirectionRow, 'id'> {
  return {
    profileId,
    direction,
    effectiveFrom: effectiveFromFor(rows, today),
    createdAt,
  }
}
