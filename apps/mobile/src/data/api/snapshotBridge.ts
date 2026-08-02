/**
 * Wires the disk snapshot store to the request cache.
 *
 * It lives apart from `client.ts` on purpose: the client stays free of storage
 * and of the live-query layer, so its tests construct it with nothing but a
 * fake fetch. The composition root (AuthContext) hands these options in.
 */
import { jsonEqual } from '../equal'
import { notifyAll } from '../live'
import type { RequestCacheOptions } from './requestCache'
import { readSnapshot, writeSnapshot } from './snapshotStore'

/** Revalidations arrive one network response at a time. Coalescing them into a
 *  single wake-up keeps a cold start from rerunning every live query once per
 *  refreshed path. */
const NOTIFY_DEBOUNCE_MS = 50

let notifyTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRevalidationNotify(): void {
  if (notifyTimer !== null) return
  notifyTimer = setTimeout(() => {
    notifyTimer = null
    notifyAll()
  }, NOTIFY_DEBOUNCE_MS)
}

/** Cancels a pending wake-up. Part of sign-out: the next account must not be
 *  greeted by a notify scheduled for the previous one. */
export function cancelRevalidationNotify(): void {
  if (notifyTimer === null) return
  clearTimeout(notifyTimer)
  notifyTimer = null
}

/** Cache options that turn on the persistent layer. */
export const snapshotCacheOptions: RequestCacheOptions = {
  snapshot: { read: readSnapshot, write: writeSnapshot },
  onRevalidated: scheduleRevalidationNotify,
  isEqual: jsonEqual,
}
