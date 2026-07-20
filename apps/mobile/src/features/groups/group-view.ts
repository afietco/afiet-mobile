import type { ApiGroupView } from '@/data/api/client'

/**
 * Keeps date-scoped fields visible while a mutation response is replaced by a
 * fresh date-scoped group query.
 */
export function mergeGroupMutationView(
  previous: ApiGroupView | null,
  next: ApiGroupView,
): ApiGroupView {
  if (!previous) return next

  const knownRatios = new Map(
    previous.members.map((member) => [member.userId, member.energyRatio]),
  )
  return {
    ...next,
    week: next.week ?? previous.week,
    members: next.members.map((member) =>
      member.energyRatio == null
        ? { ...member, energyRatio: knownRatios.get(member.userId) ?? null }
        : member,
    ),
  }
}
