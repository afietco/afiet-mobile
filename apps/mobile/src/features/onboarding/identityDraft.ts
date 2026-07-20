const IDENTITY_DRAFT_PREFIX = 'afiet:onboarding:identity:v2:'

export function identityDraftKey(userId: string): string {
  return `${IDENTITY_DRAFT_PREFIX}${userId}`
}

/** Removes an unfinished identity form owned by the ending account. */
export function clearIdentityDraft(userId: string | null): void {
  if (!userId) return
  localStorage.removeItem(identityDraftKey(userId))
}
