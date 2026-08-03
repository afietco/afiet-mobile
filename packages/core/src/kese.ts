/**
 * Ikram kesesi: the weekly allowance that pays for talking to the assistants.
 * Source design: afiet-gamification/docs/13-ikram-kesesi.md
 *
 * The allowance itself is computed by the server (GET /v1/kese), because the
 * server is what decides whether a message goes out and a second opinion that
 * could disagree with it would only ever be wrong on screen. What lives here
 * is the shared table it is built from, mirrored by internal/progress/kese.go
 * and pinned by the tests on both sides.
 *
 * The client needs that table for one thing the server does not answer: what a
 * week would be worth one tier up, which is the question the league screen
 * exists to answer.
 *
 * The wall this layer defends: logging never mints kese. Only the league tier,
 * the title band, mutual greetings and premium do.
 */

import type { LeagueTierKey } from './league'
import { TITLE_BANDS } from './progress'

/** Where a portion of the weekly allowance came from (telemetry: kese_granted). */
export type KeseSource = 'tier' | 'title' | 'greeting' | 'premium' | 'welcome'

/**
 * Weekly floor per league tier. The steps are deliberately small (a demotion
 * costs three messages, not a cliff) and the floor is never zero: Tuz still
 * carries ten, and nobody drops out of Tuz.
 */
export const KESE_TIER_BASE: Record<LeagueTierKey, number> = {
  tuz: 10,
  nane: 13,
  kekik: 16,
  sumak: 19,
  safran: 22,
}

/** A mutual greeting is worth one kese per partner per week. */
export const KESE_GREETING_PER_PARTNER = 1
/** Weekly ceiling on greeting kese; stops two accounts farming each other. */
export const KESE_GREETING_CAP = 4
/** Premium rides on top of the earned allowance, it never replaces it. */
export const KESE_PREMIUM_BONUS = 60
/** One-off grant stamped at sign-up, so the first days are not a trickle. */
export const KESE_WELCOME_GRANT = 25
/** One message to any assistant, general Afi included. There is no free agent. */
export const KESE_MESSAGE_COST = 1

/**
 * Title bonus: +1 per five-level band, so Yeni Sofra adds nothing and Sofra
 * Piri adds six. Derived from TITLE_BANDS rather than a second table, so a
 * new band cannot drift out of sync with the ladder people actually climb.
 */
export function keseTitleBonus(level: number): number {
  let bonus = 0
  for (const [index, band] of TITLE_BANDS.entries()) {
    if (level >= band.minLevel) bonus = index
  }
  return bonus
}

/** Greeting kese for a week, given how many distinct partners were greeted. */
export function keseGreetingBonus(partners: number): number {
  const greeted = Math.max(0, Math.floor(partners))
  return Math.min(greeted * KESE_GREETING_PER_PARTNER, KESE_GREETING_CAP)
}

/**
 * The allowance with its parts kept, because the breakdown is what teaches the
 * system. Mirrors the JSON the server sends.
 */
export interface KeseAllowance {
  total: number
  tier: number
  title: number
  greeting: number
  premium: number
  welcome: number
}

/**
 * What this week would have been worth in another tier, everything else held
 * still. Swapping the tier portion is exact and needs nothing the server did
 * not already send.
 */
export function keseTotalForTier(allowance: KeseAllowance, tier: LeagueTierKey): number {
  const base = KESE_TIER_BASE[tier] ?? KESE_TIER_BASE.tuz
  return allowance.total - allowance.tier + base
}
