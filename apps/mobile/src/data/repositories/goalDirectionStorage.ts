import type { GoalDirection, GoalDirectionRepository, GoalDirectionRow } from '@afiet/core'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { notify } from '../live'

/**
 * Goal direction log on AsyncStorage.
 *
 * Deliberately not sqlite: `../db` opens the database and sweeps migrations at
 * module scope, so importing it from the repository barrel would put a
 * synchronous file open on the startup path of every screen for the sake of a
 * handful of rows. Every other repository here is a network call and the sqlite
 * module is otherwise unreached, so this store carries its own persistence.
 *
 * The rows themselves stay an append-only log: a new choice is a new dated row,
 * never an edit, so any past day can still be resolved.
 */

const KEY_PREFIX = 'fh:goalDirections:'
const STORAGE_VERSION = 1

// Exhaustive by construction: adding a key to GoalDirection fails to compile
// until it is listed here, so the guard can never silently fall behind.
const KNOWN_DIRECTIONS: Record<GoalDirection, true> = {
  hafifle: true,
  donusum: true,
  koru: true,
  guclen: true,
  duzen: true,
}
const KNOWN_DIRECTION_KEYS = new Set<string>(Object.keys(KNOWN_DIRECTIONS))

interface StoredGoalDirections {
  version: typeof STORAGE_VERSION
  rows: GoalDirectionRow[]
}

// Serialises every read-modify-write, so two quick taps cannot read the same
// list and write over each other's row.
let storageQueue: Promise<void> = Promise.resolve()

function enqueueStorage<T>(operation: () => Promise<T>): Promise<T> {
  const run = storageQueue.catch(() => undefined).then(operation)
  storageQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function storageKey(profileId: number): string {
  return KEY_PREFIX + profileId
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Mapping boundary. A row written by a newer build, or a half written blob, is
 * dropped rather than surfaced: an unknown direction key would reach the
 * direction copy and render an empty screen.
 */
function parseRow(value: unknown, profileId: number): GoalDirectionRow | null {
  if (!isRecord(value)) return null
  const { id, direction, effectiveFrom, createdAt } = value
  if (typeof direction !== 'string' || !KNOWN_DIRECTION_KEYS.has(direction)) return null
  if (typeof effectiveFrom !== 'string' || !effectiveFrom) return null
  if (typeof createdAt !== 'string' || !createdAt) return null
  return {
    id: typeof id === 'number' && Number.isFinite(id) ? id : undefined,
    profileId,
    direction: direction as GoalDirection,
    effectiveFrom,
    createdAt,
  }
}

function parseRows(raw: string | null, profileId: number): GoalDirectionRow[] {
  if (!raw) return []
  try {
    const value = JSON.parse(raw) as unknown
    if (!isRecord(value) || value.version !== STORAGE_VERSION || !Array.isArray(value.rows)) {
      return []
    }
    return value.rows
      .map((row) => parseRow(row, profileId))
      .filter((row): row is GoalDirectionRow => row !== null)
  } catch {
    // Unreadable storage means no history, which resolves to the default
    // direction. Losing the log is better than a screen that cannot open.
    return []
  }
}

/** Log order: start date, then the moment of choice, then id. */
function compareRows(a: GoalDirectionRow, b: GoalDirectionRow): number {
  if (a.effectiveFrom !== b.effectiveFrom) return a.effectiveFrom < b.effectiveFrom ? -1 : 1
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1
  return (a.id ?? 0) - (b.id ?? 0)
}

async function readRows(profileId: number): Promise<GoalDirectionRow[]> {
  const raw = await AsyncStorage.getItem(storageKey(profileId))
  return parseRows(raw, profileId).sort(compareRows)
}

export const goalDirectionRepo: GoalDirectionRepository = {
  forProfile: (profileId) => enqueueStorage(() => readRows(profileId)),
  add: (row) =>
    enqueueStorage(async () => {
      const rows = await readRows(row.profileId)
      const newest = rows[rows.length - 1]
      // Re-picking the choice that is already queued for the same Monday would
      // append a row that changes nothing the read rule can observe.
      if (newest && newest.effectiveFrom === row.effectiveFrom && newest.direction === row.direction) {
        return newest.id ?? 0
      }
      const id = rows.reduce((highest, current) => Math.max(highest, current.id ?? 0), 0) + 1
      const stored: StoredGoalDirections = {
        version: STORAGE_VERSION,
        rows: [...rows, { ...row, id }],
      }
      await AsyncStorage.setItem(storageKey(row.profileId), JSON.stringify(stored))
      notify('goalDirections')
      return id
    }),
}

/**
 * Drops every profile's log. Local profile ids are not account scoped (the
 * signed-in user is always profile 1), so the next account on this device would
 * otherwise inherit these rows.
 */
export async function clearGoalDirections(): Promise<void> {
  await enqueueStorage(async () => {
    const keys = await AsyncStorage.getAllKeys()
    const ours = keys.filter((key) => key.startsWith(KEY_PREFIX))
    if (ours.length > 0) await AsyncStorage.multiRemove(ours)
  })
  notify('goalDirections')
}
