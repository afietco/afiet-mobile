/** Removes optional leading @ markers while preserving the user's visible input. */
export function normalizeFriendSearchQuery(value: string): string {
  return value.trim().replace(/^@+/, '').trim()
}
