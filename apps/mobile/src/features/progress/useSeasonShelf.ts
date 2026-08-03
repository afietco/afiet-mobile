/**
 * The closed seasons behind the profile shelf.
 *
 * Tied to the `profiles` live key rather than to anything of its own: the
 * shelf only changes when a month closes, which is a server event nothing in
 * the app can trigger. Refetching it on a sign-in is enough.
 */
import { requireApi } from '@/data/api/apiHolder'
import { useLiveValue } from '@/data/useLive'
import type { LeagueTierKey } from '@afiet/core'
import type { SeasonBadge } from './SeasonShelf'

export function useSeasonShelf(): SeasonBadge[] | undefined {
  return useLiveValue(
    ['profiles'],
    async () => {
      const history = await requireApi().leagueHistory()
      return history.seasons.map((season) => ({
        seasonStart: season.seasonStart,
        tier: season.tier as LeagueTierKey,
      }))
    },
    [],
  )
}
