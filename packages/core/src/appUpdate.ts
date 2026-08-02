/**
 * When an installed version is too old, and what to do about it.
 *
 * Two thresholds, decided by the server and compared here:
 *
 *  - `minimumVersion`: below it the client is not allowed to keep running.
 *    This is the lever for the day an API contract changes under a shipped
 *    build, or a release goes out that corrupts something. It is expensive to
 *    use (people are locked out of their own data until they update), so it is
 *    deliberately separate from the ordinary "there is a newer one" nudge.
 *  - `latestVersion`: what the store has. Below it the app suggests updating
 *    and takes no for an answer.
 *
 * Per platform, because the two stores never publish at the same moment: Apple
 * reviews, Play rolls out in stages, and a single global "latest" would tell
 * half the fleet to go install something that is not there yet.
 *
 * Everything here is pure. The decision is the part worth testing; fetching,
 * storing and drawing live in the app.
 */

/** One store's view of what is published. All fields optional: a gate with
 *  nothing set is the normal state and produces no verdict at all. */
export interface PlatformVersionGate {
  /** Newest version available in that store. */
  latestVersion?: string | null
  /** Below this the app refuses to run. */
  minimumVersion?: string | null
  /** Where to send someone to update. */
  storeUrl?: string | null
  /** One line explaining a forced update, in the product's voice. */
  message?: string | null
}

export interface AppVersionGate {
  ios?: PlatformVersionGate | null
  android?: PlatformVersionGate | null
}

export type UpdatePlatform = 'ios' | 'android'

export type UpdateVerdict =
  /** Nothing to say: current, unparseable, or already reminded recently. */
  | { kind: 'none' }
  /** A newer version exists; the person may decline. */
  | { kind: 'suggested'; version: string; storeUrl: string | null; message: string | null }
  /** Too old to run; the only way forward is the store. */
  | { kind: 'required'; version: string; storeUrl: string | null; message: string | null }

/** How long a declined suggestion stays declined. */
export const UPDATE_REMINDER_INTERVAL_MS = 3 * 24 * 60 * 60 * 1000

interface ParsedVersion {
  numbers: number[]
  /** Anything after `-`; present means a pre-release, which sorts below its release. */
  prerelease: string | null
}

/**
 * Reads a dotted version. Returns null for anything it cannot make sense of,
 * and every caller treats null as "do not gate": being unable to parse a
 * version must never be what locks somebody out of the app.
 */
export function parseVersion(value: string | null | undefined): ParsedVersion | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/^v/i, '')
  if (trimmed === '') return null
  // Build metadata (`+1234`) never affects precedence, so it is dropped first.
  const [withoutBuild] = trimmed.split('+')
  const [core, ...prereleaseParts] = (withoutBuild ?? '').split('-')
  const segments = (core ?? '').split('.')
  const numbers: number[] = []
  for (const segment of segments) {
    if (!/^\d+$/.test(segment)) return null
    numbers.push(Number(segment))
  }
  if (numbers.length === 0) return null
  return { numbers, prerelease: prereleaseParts.length > 0 ? prereleaseParts.join('-') : null }
}

/**
 * Orders two versions: negative when `a` is older, 0 when equal, positive when
 * newer. Missing segments count as zero, so "1.2" and "1.2.0" are the same
 * version. Returns null when either side is unparseable.
 */
export function compareVersions(a: string | null | undefined, b: string | null | undefined): number | null {
  const left = parseVersion(a)
  const right = parseVersion(b)
  if (!left || !right) return null

  const length = Math.max(left.numbers.length, right.numbers.length)
  for (let index = 0; index < length; index += 1) {
    const difference = (left.numbers[index] ?? 0) - (right.numbers[index] ?? 0)
    if (difference !== 0) return difference < 0 ? -1 : 1
  }
  // Equal numbers: a pre-release comes before the release it leads to.
  if (left.prerelease === right.prerelease) return 0
  if (left.prerelease === null) return 1
  if (right.prerelease === null) return -1
  return left.prerelease < right.prerelease ? -1 : 1
}

/** True when `version` is strictly older than `other`; false when equal, newer,
 *  or not comparable. */
export function isOlderThan(version: string | null | undefined, other: string | null | undefined): boolean {
  const order = compareVersions(version, other)
  return order !== null && order < 0
}

export interface UpdateDecisionInput {
  /** The running build's version, from the app config. */
  currentVersion: string | null | undefined
  platform: UpdatePlatform
  /** Last answer from the server, or null when it has never answered. */
  gate: AppVersionGate | null | undefined
  /** Version whose suggestion was last declined, if any. */
  remindedVersion?: string | null
  /** When that suggestion was declined (epoch millis). */
  remindedAt?: number | null
  now: number
  reminderIntervalMs?: number
}

/**
 * Turns the server's answer into what the app should show right now.
 *
 * Ordered so a required update always wins: someone who is both below the
 * minimum and behind the latest sees the wall, never the dismissible card.
 */
export function decideAppUpdate({
  currentVersion,
  platform,
  gate,
  remindedVersion,
  remindedAt,
  now,
  reminderIntervalMs = UPDATE_REMINDER_INTERVAL_MS,
}: UpdateDecisionInput): UpdateVerdict {
  if (!gate) return { kind: 'none' }
  const platformGate = platform === 'ios' ? gate.ios : gate.android
  if (!platformGate) return { kind: 'none' }
  // An unreadable running version is not evidence of anything. Gating on it
  // would turn a config typo into a fleet-wide lockout.
  if (!parseVersion(currentVersion)) return { kind: 'none' }

  const storeUrl = platformGate.storeUrl ?? null
  const message = platformGate.message ?? null

  if (isOlderThan(currentVersion, platformGate.minimumVersion)) {
    /* Sent to the newest there is, not merely to the minimum: the store only
       offers its current build anyway, and naming the minimum here would read
       as though an older one were still an option. */
    const target = platformGate.latestVersion ?? platformGate.minimumVersion ?? null
    if (target) return { kind: 'required', version: target, storeUrl, message }
  }

  if (isOlderThan(currentVersion, platformGate.latestVersion)) {
    const target = platformGate.latestVersion as string
    const declinedThisOne = remindedVersion === target
    const withinQuietPeriod =
      typeof remindedAt === 'number' && now - remindedAt < reminderIntervalMs
    if (declinedThisOne && withinQuietPeriod) return { kind: 'none' }
    return { kind: 'suggested', version: target, storeUrl, message }
  }

  return { kind: 'none' }
}
