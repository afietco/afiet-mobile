import { todayISO, type GoalDirection, type GoalDirectionRow } from '@afiet/core'
import { useCallback, useMemo } from 'react'
import { goalDirectionRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { useActiveProfile } from '../profile/useActiveProfile'
import {
  buildDirectionRow,
  nextEffectiveFrom,
  pendingDirection,
  resolveDirection,
  type PendingGoalDirection,
} from './goalDirection'

const NO_ROWS: GoalDirectionRow[] = []

export interface GoalDirectionState {
  /** The direction in force today; `duzen` while the user has not chosen one. */
  direction: GoalDirection
  /** True while `direction` is the silent default rather than a stored choice. */
  isDefault: boolean
  /** A choice waiting for its Monday, or null when nothing is queued. */
  pending: PendingGoalDirection | null
  /** The Monday a choice made today would start on; what the screen promises. */
  startsOn: string
  loading: boolean
  error: Error | null
  /** Appends a dated row. The change lands on `startsOn`, never today. */
  choose: (direction: GoalDirection) => Promise<void>
}

/**
 * The active and pending goal direction for the signed in profile.
 *
 * `today` is a parameter so a caller (or a test) can ask about any day; the
 * clock is read exactly once here, as its default, and nowhere in the rules
 * below it.
 */
export function useGoalDirection(today: string = todayISO()): GoalDirectionState {
  const { id: profileId } = useActiveProfile()
  const { data, error, loading } = useLive<GoalDirectionRow[]>(
    ['goalDirections'],
    async () => (profileId == null ? NO_ROWS : goalDirectionRepo.forProfile(profileId)),
    [profileId],
  )
  const rows = data ?? NO_ROWS

  const choose = useCallback(
    async (direction: GoalDirection) => {
      if (profileId == null) return
      await goalDirectionRepo.add(
        buildDirectionRow(profileId, direction, today, new Date().toISOString()),
      )
    },
    [profileId, today],
  )

  return useMemo(
    () => ({
      direction: resolveDirection(rows, today),
      isDefault: rows.every((row) => row.effectiveFrom > today),
      pending: pendingDirection(rows, today),
      startsOn: nextEffectiveFrom(today),
      loading,
      error,
      choose,
    }),
    [rows, today, loading, error, choose],
  )
}
