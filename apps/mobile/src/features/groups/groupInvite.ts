import type { ApiGroupSummary } from '@/data/api/client'

export type GroupInviteResolution =
  | { status: 'current'; group: ApiGroupSummary }
  | { status: 'join'; code: string }

/** Resolves an invitation against the user's loaded groups without a network request. */
export function resolveGroupInvite(
  groups: ApiGroupSummary[],
  rawCode: string,
): GroupInviteResolution {
  const code = rawCode.trim().toUpperCase()
  const currentGroup = groups.find((group) => group.code.trim().toUpperCase() === code)
  return currentGroup ? { status: 'current', group: currentGroup } : { status: 'join', code }
}
