/**
 * Whether the trouble is ours.
 *
 * When a request fails the app cannot tell a service outage from a bad train
 * tunnel, and until now it guessed the tunnel: every failure screen asked the
 * person to check their own connection. During a real outage that reading is
 * not just wrong, it is expensive, because the only things left to try are
 * destructive. Signing out clears every local draft and flag for an account,
 * and reinstalling clears the rest while keeping the very tokens people are
 * trying to shed. Someone did all of that during the July 29th database
 * incident and none of it could have helped.
 *
 * The status page answers the question directly, and it answers it from
 * somewhere else: afiet.co is on Vercel while the API is on Cloud Run, so it
 * stays up precisely when the API does not. That gives three honest outcomes
 * rather than one guess:
 *
 *  - reachable, and reporting trouble -> it is us, and we can say so
 *  - reachable, and reporting healthy -> not a known outage; a retry is fair
 *  - unreachable too                  -> the device is offline, so the old
 *                                        advice was right after all
 *
 * Only consulted once something has already failed, so a healthy session never
 * pays for it.
 */

const STATUS_ENDPOINT = 'https://afiet.co/api/status'
export const STATUS_PAGE_URL = 'https://status.afiet.co'

/** Kept short: this runs while somebody is looking at a failed screen. */
const STATUS_TIMEOUT_MS = 5_000

/**
 * How long one answer stands for.
 *
 * A failing screen asks several queries and each of them would otherwise ask
 * again, so the first answer covers the rest of the burst. Short enough that
 * the end of an incident is noticed on the next retry.
 */
const STATUS_TTL_MS = 30_000

export type ServiceStatus =
  /** The status page says something of ours is down or degraded. */
  | { verdict: 'outage'; affected: string[] }
  /** The status page is reachable and reports everything healthy. */
  | { verdict: 'healthy' }
  /** We could not reach the status page either, so the device is likely offline. */
  | { verdict: 'unknown' }

interface StatusResponse {
  overall?: { state?: string }
  components?: { name?: string; state?: string }[]
}

/** Anything the status page does not call `up` counts as trouble worth naming. */
function isDown(state: string | undefined): boolean {
  return state !== undefined && state !== 'up' && state !== 'none'
}

let cached: { at: number; value: ServiceStatus } | null = null
let inFlight: Promise<ServiceStatus> | null = null

/** Forgets the cached verdict, so the next failure asks again. */
export function resetServiceStatus(): void {
  cached = null
  inFlight = null
}

async function read(): Promise<ServiceStatus> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS)
  try {
    const response = await fetch(STATUS_ENDPOINT, { signal: controller.signal })
    if (!response.ok) return { verdict: 'unknown' }
    const body = (await response.json()) as StatusResponse
    const affected = (body.components ?? [])
      .filter((component) => isDown(component.state))
      .map((component) => component.name)
      .filter((name): name is string => !!name)

    if (isDown(body.overall?.state) || affected.length > 0) return { verdict: 'outage', affected }
    return { verdict: 'healthy' }
  } catch {
    /* No network, DNS failure, timeout. All of them mean the same thing from
       here: we cannot say it is us, and the device probably cannot reach
       anything at all. */
    return { verdict: 'unknown' }
  } finally {
    clearTimeout(timer)
  }
}

/** Asks the status page whether a failure the app just saw is ours. */
export function checkServiceStatus(now: () => number = Date.now): Promise<ServiceStatus> {
  const hit = cached
  if (hit && now() - hit.at < STATUS_TTL_MS) return Promise.resolve(hit.value)
  if (inFlight) return inFlight

  const request = read()
    .then((value) => {
      cached = { at: now(), value }
      return value
    })
    .finally(() => {
      inFlight = null
    })

  inFlight = request
  return request
}
