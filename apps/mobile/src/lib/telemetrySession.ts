import * as Crypto from 'expo-crypto'

/**
 * Session identity for behavior telemetry. The id is created eagerly at module
 * load so every event carries a sid from the very first render; the lifecycle
 * hook (useSessionTracking) decides when a session ends and rotates the id.
 * The admin panel groups events into sessions purely by this sid.
 */
let sid = Crypto.randomUUID()

/** AsyncStorage key of the persisted session heartbeat (owned by
    useSessionTracking; shared here so sign-out teardown can clear it). */
export const TELEMETRY_SESSION_STORAGE_KEY = 'afiet.telemetry.session'

export function currentSid(): string {
  return sid
}

export function rotateSid(): string {
  sid = Crypto.randomUUID()
  return sid
}

/** A notification-launch mark older than this is stale: it belonged to a tap
    that never produced a session_start (e.g. a foreground banner tap) and must
    not label a later, organic session. */
const LAUNCH_MARK_TTL_MS = 30_000

let launchMarkedAt = 0

/** Called by the push layer when the app was opened through a notification. */
export function markLaunchFromNotification(): void {
  launchMarkedAt = Date.now()
}

/** Reads and clears the notification-launch flag; an open must count once,
    and only if it happened moments before the session started. */
export function consumeLaunchFromNotification(): boolean {
  const fresh = launchMarkedAt !== 0 && Date.now() - launchMarkedAt < LAUNCH_MARK_TTL_MS
  launchMarkedAt = 0
  return fresh
}
