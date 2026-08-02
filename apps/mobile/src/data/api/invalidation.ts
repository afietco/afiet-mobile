/**
 * Which reads a write invalidates.
 *
 * Until now every mutation called invalidateAll(): one glass of water dropped
 * the entire read cache, and the notify() that followed sent every live query
 * on that table back to the network. With 51 useLive call sites the cost grew
 * with how much a person actually logged, which is exactly backwards.
 *
 * The map is deliberately generous. Getting a target wrong in the "too many"
 * direction costs one refetch; getting it wrong in the "too few" direction
 * leaves stale data on screen, and nothing else in the system would catch it.
 * For the same reason an unrecognised mutation falls back to invalidating
 * everything (see invalidationTargets): a new endpoint is safe by default and
 * only loses a little cache until someone adds its rule.
 */

/** Reads derived from logged behaviour. Almost every write moves these, and
 *  '/v1/summary' as a prefix also covers '/v1/summary/week' and its closure
 *  and history variants. */
const DERIVED = ['/v1/summary', '/v1/progress', '/v1/league', '/v1/quests', '/v1/kese']

/**
 * Longest matching mutation prefix wins. `null` means "invalidate everything".
 * An empty array means "this write changes nothing anyone reads back", which is
 * a claim worth making explicitly rather than by omission.
 */
const RULES: [prefix: string, targets: string[] | null][] = [
  // Account deletion ends every read there is.
  ['/v1/account', null],

  // Height and activity level feed the daily targets.
  ['/v1/profile', ['/v1/profile', ...DERIVED]],

  // Device registration is write-only state.
  ['/v1/push/devices', []],
  ['/v1/push/preferences', ['/v1/push/preferences']],

  // Meals move the summary, the rhythm, every gamification surface, and the
  // energy rings friends and group members see.
  ['/v1/meals', ['/v1/meals', ...DERIVED, '/v1/friends', '/v1/groups']],
  ['/v1/water', ['/v1/water', ...DERIVED]],
  ['/v1/measurements', ['/v1/measurements', ...DERIVED]],

  // A custom food's macros are summed into days that already reference it.
  ['/v1/custom-foods', ['/v1/custom-foods', '/v1/summary']],
  ['/v1/sofras', ['/v1/sofras']],

  // Joining, leaving, greeting: membership changes quests and standings too.
  ['/v1/groups', ['/v1/groups', '/v1/friends', ...DERIVED]],
  // Requests carry a friendStatus that also appears in search and code lookups.
  ['/v1/friends', ['/v1/friends', '/v1/users', ...DERIVED]],

  ['/v1/notifications', ['/v1/notifications']],
  ['/v1/summary/week/closure/ack', ['/v1/summary']],
  ['/v1/quests', DERIVED],

  // The assistant endpoints are POSTs that read rather than write.
  ['/v1/afi/', []],
  ['/v1/events', []],
]

/** Sorted once so the first match is always the most specific one. */
const SORTED_RULES = [...RULES].sort(([a], [b]) => b.length - a.length)

/**
 * Read-path prefixes a mutation invalidates, or `null` for "everything".
 * Query strings are ignored: rules are about endpoints, not arguments.
 */
export function invalidationTargets(path: string): string[] | null {
  const endpoint = path.split('?')[0]
  for (const [prefix, targets] of SORTED_RULES) {
    if (endpoint.startsWith(prefix)) return targets
  }
  return null
}
