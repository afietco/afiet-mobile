import { keseState, type KeseInput, type KeseState } from '@afiet/core'

/**
 * Mock kese data, and the ONLY file to delete when GET /v1/kese lands.
 *
 * The UI slice ships before the ledger exists (docs/13 has no code yet), so
 * these scenarios stand in for the server. They are the calibration table from
 * docs/13 turned into states someone can actually walk through on a device:
 * the new user's ten, the typical week, the last few messages, an empty kese
 * and a premium week.
 *
 * Long-pressing the kese chip cycles them. That control lives here rather than
 * behind a debug screen so it disappears together with the mock.
 */

export interface KeseScenario {
  key: string
  /** Shown while cycling, so it is clear which state is on screen. */
  label: string
  input: KeseInput
  spent: number
}

export const KESE_SCENARIOS: readonly KeseScenario[] = [
  {
    key: 'typical',
    label: 'Tipik hafta · Nane, seviye 7',
    input: { tier: 'nane', level: 7, greetingPartners: 2, premium: false, welcome: false },
    spent: 4,
  },
  {
    key: 'new',
    label: 'Yeni kullanıcı · Tuz, hoş geldin dolumu',
    input: { tier: 'tuz', level: 1, greetingPartners: 0, premium: false, welcome: true },
    spent: 3,
  },
  {
    key: 'low',
    label: 'Az kaldı · 2 mesaj',
    input: { tier: 'nane', level: 7, greetingPartners: 2, premium: false, welcome: false },
    spent: 14,
  },
  {
    key: 'empty',
    label: 'Boş kese',
    input: { tier: 'tuz', level: 3, greetingPartners: 1, premium: false, welcome: false },
    spent: 11,
  },
  {
    key: 'ceiling',
    label: 'Freemium tavanı · Safran, 4 selam',
    input: { tier: 'safran', level: 30, greetingPartners: 4, premium: false, welcome: false },
    spent: 9,
  },
  {
    key: 'premium',
    label: 'Premium hafta',
    input: { tier: 'kekik', level: 12, greetingPartners: 3, premium: true, welcome: false },
    spent: 21,
  },
]

let index = 0
/** Messages sent since the scenario was picked, so spending is visible live. */
let extraSpent = 0
const listeners = new Set<() => void>()

function emit(): void {
  for (const listener of listeners) listener()
}

export function subscribeKeseMock(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function currentKeseScenario(): KeseScenario {
  return KESE_SCENARIOS[index] ?? KESE_SCENARIOS[0]!
}

/**
 * The snapshot is cached because useSyncExternalStore compares by identity:
 * rebuilding the state on every read would loop forever.
 */
let snapshot: KeseState = buildSnapshot()

function buildSnapshot(): KeseState {
  const scenario = currentKeseScenario()
  return keseState(scenario.input, scenario.spent + extraSpent)
}

function refresh(): void {
  snapshot = buildSnapshot()
  emit()
}

export function keseMockSnapshot(): KeseState {
  return snapshot
}

/** Next scenario, wrapping around. Returns the one now on screen. */
export function cycleKeseMock(): KeseScenario {
  index = (index + 1) % KESE_SCENARIOS.length
  extraSpent = 0
  refresh()
  return currentKeseScenario()
}

/** Spends one kese, the way sending a message will once the server keeps count. */
export function spendKeseMock(): void {
  extraSpent += 1
  refresh()
}
