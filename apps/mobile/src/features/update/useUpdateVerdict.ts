/**
 * Subscribes a screen to the update verdict.
 *
 * The value is recomputed on every notification rather than stored, because
 * two of its inputs are time-based (the quiet period after a decline, the age
 * ceiling on a stored answer) and a cached verdict would outlive them.
 */
import { useSyncExternalStore } from 'react'
import type { UpdateVerdict } from '@afiet/core'
import { currentUpdateVerdict, subscribeToVersionGate } from './versionGate'

/* useSyncExternalStore compares snapshots by identity, so a fresh object every
   call would loop forever. The verdict is small and flat: it is cached here
   and replaced only when something about it actually differs. */
let cached: UpdateVerdict = { kind: 'none' }

function snapshot(): UpdateVerdict {
  const next = currentUpdateVerdict()
  if (
    next.kind !== cached.kind ||
    (next.kind !== 'none' &&
      cached.kind !== 'none' &&
      (next.version !== cached.version ||
        next.storeUrl !== cached.storeUrl ||
        next.message !== cached.message))
  ) {
    cached = next
  }
  return cached
}

export function useUpdateVerdict(): UpdateVerdict {
  return useSyncExternalStore(subscribeToVersionGate, snapshot, snapshot)
}
