/**
 * The store's answer to "is this build still current", kept on disk.
 *
 * Read from afiet.co rather than from our own API, for the same reason the
 * outage check is (see features/status/serviceStatus.ts): the web app is on
 * Vercel and the API is on Cloud Run, so it stays up precisely when the API
 * does not. The day this lever is actually needed is the day a shipped build
 * is talking to the API wrongly, and asking that same API whether the build is
 * too old would be asking the broken thing about its own brokenness.
 *
 * Disk first, network after. The last answer is hydrated behind the splash and
 * the verdict is decided from it synchronously, so a launch never waits on a
 * request: the wall a locked-out build should see appears on the first frame,
 * and a healthy launch pays nothing at all. The refresh runs in the background
 * and moves the verdict when it lands, which is at most a second late for a
 * decision that is measured in days.
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import {
  decideAppUpdate,
  type AppVersionGate,
  type UpdatePlatform,
  type UpdateVerdict,
} from '@afiet/core'

const GATE_KEY = 'fh:appVersionGate'
const REMINDER_KEY = 'fh:appUpdateReminder'

/** Public, unauthenticated, cached at the edge. Overridable so a dev build can
 *  point at a preview deployment without shipping the override to anyone. */
const GATE_URL = process.env.EXPO_PUBLIC_VERSION_GATE_URL ?? 'https://afiet.co/api/app-version'

/** The request runs while somebody is waiting to use the app; it is never
 *  allowed to become the reason a launch feels slow. */
const FETCH_TIMEOUT_MS = 6_000

/**
 * How long a stored answer keeps deciding on its own.
 *
 * A cached gate is the last thing the server actually said, which beats no
 * answer at all. But a forced-update flag set during an incident must not
 * outlive the incident on a device that has been offline since: after this it
 * expires and the app opens normally until a fresh answer arrives.
 */
const GATE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

interface StoredGate {
  at: number
  gate: AppVersionGate
}

interface Reminder {
  version: string
  at: number
}

let gate: AppVersionGate | null = null
let gateFetchedAt = 0
let reminder: Reminder | null = null
let refreshInFlight: Promise<void> | null = null
const listeners = new Set<() => void>()

/** Overrides everything below it. Development only: the preview screens set
 *  this to show a verdict that no server is currently reporting. */
let override: UpdateVerdict | null = null

function emit(): void {
  listeners.forEach((listener) => listener())
}

export function subscribeToVersionGate(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function runningPlatform(): UpdatePlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android'
}

export function currentAppVersion(): string | null {
  return Constants.expoConfig?.version ?? null
}

function readDoorMode(value: unknown): 'progressive' | 'open' | null {
  return value === 'open' || value === 'progressive' ? value : null
}

/**
 * How the Bugün board opens, from the last stored answer. Synchronous like the
 * verdict, and "progressive" whenever nothing readable says otherwise: the
 * switch only ever opens doors early, so a stale or missing answer errs
 * towards the shipped behaviour.
 */
export function currentFtueDoorMode(): 'progressive' | 'open' {
  return gate?.flags?.ftueDoors === 'open' ? 'open' : 'progressive'
}

/** Today's verdict from what is already in memory. Synchronous by design: the
 *  root layout asks on its first render and cannot await. */
export function currentUpdateVerdict(now: number = Date.now()): UpdateVerdict {
  if (override) return override
  if (!gate || now - gateFetchedAt > GATE_MAX_AGE_MS) return { kind: 'none' }
  return decideAppUpdate({
    currentVersion: currentAppVersion(),
    platform: runningPlatform(),
    gate,
    remindedVersion: reminder?.version ?? null,
    remindedAt: reminder?.at ?? null,
    now,
  })
}

/**
 * Loads the stored answer and the declined-suggestion mark. Called behind the
 * splash alongside the other persisted startup state; failures leave the app
 * ungated, which is the safe direction.
 */
export async function hydrateVersionGate(): Promise<void> {
  try {
    const [storedGate, storedReminder] = await AsyncStorage.multiGet([GATE_KEY, REMINDER_KEY])
    const rawGate = storedGate?.[1]
    if (rawGate) {
      const parsed = JSON.parse(rawGate) as StoredGate | null
      if (parsed && typeof parsed.at === 'number' && parsed.gate) {
        gate = parsed.gate
        gateFetchedAt = parsed.at
      }
    }
    const rawReminder = storedReminder?.[1]
    if (rawReminder) {
      const parsed = JSON.parse(rawReminder) as Reminder | null
      if (parsed && typeof parsed.at === 'number' && typeof parsed.version === 'string') {
        reminder = parsed
      }
    }
  } catch {
    // A corrupt blob simply means no gate until the network answers.
  }
}

/**
 * Asks afiet.co what the stores have. Safe to call on every launch and on
 * every return from the background: it is one small cached GET, it never
 * throws, and it only replaces the stored answer when the response parses.
 */
export function refreshVersionGate(now: () => number = Date.now): Promise<void> {
  if (refreshInFlight) return refreshInFlight

  const request = (async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const response = await fetch(GATE_URL, { signal: controller.signal })
      if (!response.ok) return
      const body = (await response.json()) as AppVersionGate | null
      if (!body || typeof body !== 'object') return

      // The two platform blocks and the flags are kept; anything else the
      // endpoint grows later is ignored here rather than stored and misread.
      const next: AppVersionGate = {
        ios: body.ios ?? null,
        android: body.android ?? null,
        flags: body.flags && typeof body.flags === 'object' ? { ftueDoors: readDoorMode(body.flags.ftueDoors) } : null,
      }
      gate = next
      gateFetchedAt = now()
      emit()
      await AsyncStorage.setItem(GATE_KEY, JSON.stringify({ at: gateFetchedAt, gate: next }))
    } catch {
      /* Offline, DNS, timeout, malformed body. All of them mean the same thing:
         keep deciding from the stored answer. */
    } finally {
      clearTimeout(timer)
    }
  })().finally(() => {
    refreshInFlight = null
  })

  refreshInFlight = request
  return request
}

/**
 * Records that a suggestion was declined, so the same version stops asking for
 * a few days. Required updates never reach here; there is no declining those.
 */
export async function declineUpdate(version: string, now: number = Date.now()): Promise<void> {
  reminder = { version, at: now }
  emit()
  try {
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(reminder))
  } catch {
    // Failing to remember costs one repeated prompt, nothing more.
  }
}

/** Development seam for the preview screens. Ignored in release builds. */
export function setUpdateVerdictOverride(next: UpdateVerdict | null): void {
  if (!__DEV__) return
  override = next
  emit()
}

/** Test seam; production never calls this. */
export function resetVersionGate(): void {
  gate = null
  gateFetchedAt = 0
  reminder = null
  override = null
  refreshInFlight = null
}
