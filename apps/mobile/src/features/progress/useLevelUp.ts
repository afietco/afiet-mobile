import { titleForLevel } from '@afiet/core'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useState } from 'react'
import { useProgressResult } from './useProgress'

/**
 * Level-up detection for the celebration host.
 *
 * The server owns experience; the client only notices when the level it last
 * saw is left behind. The marker is stored per account so a second account on
 * the same phone never inherits somebody else's milestone, and the first read
 * of an account only seeds it: signing in must never replay old history.
 *
 * Experience never decreases (docs/09 invariant #1), so a lower level can only
 * come from another device or a reset. That case follows the server quietly.
 */

const LEVEL_KEY_PREFIX = 'fh:progress:level:'

export interface LevelUpEvent {
  level: number
  title: string
  /** True when the new level also opened a new title band. */
  titleChanged: boolean
}

function levelKey(accountId: string): string {
  return LEVEL_KEY_PREFIX + encodeURIComponent(accountId)
}

export function useLevelUp(accountId: string | null): {
  event: LevelUpEvent | null
  ack: () => void
} {
  const { data: progress } = useProgressResult()
  const [event, setEvent] = useState<LevelUpEvent | null>(null)
  const level = progress?.level

  useEffect(() => {
    if (!accountId || level === undefined) return
    let alive = true

    void (async () => {
      try {
        const key = levelKey(accountId)
        const stored = await AsyncStorage.getItem(key)
        if (!alive) return
        await AsyncStorage.setItem(key, String(level))
        if (!alive) return

        const previous = stored === null ? Number.NaN : Number(stored)
        if (!Number.isFinite(previous) || level <= previous) return
        setEvent({
          level,
          title: titleForLevel(level),
          titleChanged: titleForLevel(previous) !== titleForLevel(level),
        })
      } catch {
        // A storage failure costs at most one celebration, never the session.
      }
    })()

    return () => {
      alive = false
    }
  }, [accountId, level])

  const ack = useCallback(() => setEvent(null), [])

  return { event, ack }
}
