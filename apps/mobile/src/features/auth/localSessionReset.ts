/**
 * Local session teardown, shared by the AuthProvider (intentional sign-out and
 * expired-session paths) and by the top-level error escape hatch. Keeping the
 * task list in one place stops the two callers from drifting apart; every
 * store cleared on sign-out is also cleared when a user breaks out of a crash.
 *
 * All tasks are module-level resets (no React context), so this runs from a
 * class error boundary rendered ABOVE the AuthProvider as well.
 */
import { setApiClient } from '@/data/api/apiHolder'
import { resetIdMap } from '@/data/api/idMap'
import { cancelRevalidationNotify } from '@/data/api/snapshotBridge'
import { clearSnapshots } from '@/data/api/snapshotStore'
import { clearGoalDirections } from '@/data/repositories/goalDirectionStorage'
import { clearAfiPhotoDraft } from '@/features/nutrition/afiPhotoDraft'
import { resetChapters } from '@/features/ftue/chapter-store'
import { clearChapterCue } from '@/features/ftue/cues'
import { resetFtueFlags } from '@/features/ftue/ftueFlags'
import { resetGroupsStore } from '@/features/groups/useGroups'
import { clearNotifications } from '@/features/notifications/notifications'
import { clearIdentityDraft } from '@/features/onboarding/identityDraft'
import { clearKnownName } from '@/features/onboarding/knownName'
import { clearPendingFirstMeal } from '@/features/onboarding/pendingFirstMeal'
import { clearLocalPushRegistration } from '@/features/push/push-notifications'
import { resetSocialStore } from '@/features/social/store'
import { resetWidgetState } from '@/features/widget/widgetBridge'
import { resetTelemetry } from '@/lib/track'
import { clearPendingEmailChange } from './pendingEmailChange'
import { runSessionResetTasks, type SessionResetTask } from './sessionReset'
import { userIdFromAccessToken } from './stackAuth'
import { clearTokens, loadTokens } from './tokenStore'

function localSessionResetTasks(endingUserId: string | null): SessionResetTask[] {
  return [
    { name: 'API client', reset: () => setApiClient(null) },
    { name: 'authentication tokens', reset: clearTokens },
    { name: 'notifications', reset: clearNotifications },
    { name: 'social store', reset: resetSocialStore },
    { name: 'groups store', reset: resetGroupsStore },
    { name: 'FTUE flags', reset: resetFtueFlags },
    { name: 'FTUE chapters', reset: resetChapters },
    { name: 'FTUE cue', reset: clearChapterCue },
    { name: 'pending email change', reset: clearPendingEmailChange },
    { name: 'onboarding identity draft', reset: () => clearIdentityDraft(endingUserId) },
    { name: 'onboarding known name', reset: () => clearKnownName(endingUserId) },
    { name: 'pending first meal', reset: clearPendingFirstMeal },
    { name: 'Afi photo draft', reset: clearAfiPhotoDraft },
    { name: 'goal directions', reset: clearGoalDirections },
    { name: 'push registration', reset: clearLocalPushRegistration },
    { name: 'identifier map', reset: resetIdMap },
    { name: 'widget state', reset: resetWidgetState },
    /* The persisted read snapshot is the one store that would otherwise paint
       the previous account's summary onto the next account's first screen.
       The pending wake-up goes with it: a notify scheduled for the ending
       session has nothing to say to the new one. */
    { name: 'response snapshots', reset: clearSnapshots },
    { name: 'revalidation wake-up', reset: cancelRevalidationNotify },
    // Undelivered events and the session heartbeat would otherwise be flushed
    // under, or stitched into, the next account's sessions.
    { name: 'behavior telemetry', reset: resetTelemetry },
  ]
}

/** Clears every local store for the ending account, tolerating individual failures. */
export async function clearLocalSession(endingUserId: string | null): Promise<void> {
  const failures = await runSessionResetTasks(localSessionResetTasks(endingUserId))

  for (const failure of failures) {
    console.warn(`[auth] failed to reset ${failure.name}`, failure.reason)
  }
}

/**
 * Escape hatch for the top-level error boundary: clears the persisted session
 * (including the Keychain tokens that survive an app reinstall) without any
 * React context, so a user trapped by a deterministic startup crash drops back
 * to the anonymous state and can sign in fresh. Best-effort throughout; a
 * failure here must never re-throw into the boundary that called it.
 */
export async function hardResetToAnon(): Promise<void> {
  let endingUserId: string | null = null
  try {
    const tokens = await loadTokens()
    endingUserId = tokens ? userIdFromAccessToken(tokens.accessToken) : null
  } catch {
    // Unreadable tokens still get cleared below; identity draft cleanup is skipped.
  }
  await clearLocalSession(endingUserId)
}
