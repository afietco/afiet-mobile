import { requireApi } from '@/data/api/apiHolder'
import type { ApiKese } from '@/data/api/client'
import { notify } from '@/data/live'
import { useLive } from '@/data/useLive'

/**
 * The weekly kese, as the screens see it.
 *
 * Bound to two live keys. `kese` is notified when a message is sent, because
 * sending is what spends one; `groups` because a mutual greeting widens the
 * week and joining a group is where greetings come from.
 */
export function useKese(): ApiKese | null {
  const { data } = useLive(['kese', 'groups'], () => requireApi().getKese(), [])
  /**
   * Null while loading, and null while the feature is asleep server-side.
   *
   * Collapsing both into one absent value is deliberate: every surface then
   * reads "no kese to show" and hides itself, rather than each one deciding
   * separately what a disabled feature or an unanswered request looks like.
   * A zero drawn during either would read as an empty kese, which is a
   * different and much louder thing.
   */
  return data?.enabled ? data : null
}

/**
 * Re-reads the kese after a message has been sent.
 *
 * The server counts the spend when it accepts the request, so this is called
 * once the exchange is over however it ended: a stream that failed halfway
 * still cost the call it made, and the number on screen has to say so.
 */
export function refreshKese(): void {
  notify('kese')
}
