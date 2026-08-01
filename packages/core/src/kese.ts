/**
 * Ikram kesesi: the weekly allowance that pays for talking to the assistants.
 * Source design: afiet-gamification/docs/13-ikram-kesesi.md
 *
 * The wall this layer defends: logging never mints kese. Only the league tier,
 * the title band, mutual greetings and premium do. A kese is spent on one
 * message to any of the three assistants, and it is a weekly right rather than
 * a balance: it refreshes every Monday, never carries over, never transfers.
 *
 *   allowance = tier base + title bonus + this week's greetings (+ premium)
 *   remaining = allowance - messages sent this week
 *
 * Pure and platform independent, because the server computes the same numbers
 * and this file is the single source of truth for both.
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

export interface KeseInput {
  tier: LeagueTierKey
  level: number
  /** Distinct people greeted mutually this week; capped at KESE_GREETING_CAP. */
  greetingPartners: number
  premium: boolean
  /** True while the one-off sign-up grant still applies to this week. */
  welcome: boolean
}

/** The allowance with its parts kept, because the breakdown is what teaches the system. */
export interface KeseAllowance {
  total: number
  tier: number
  title: number
  greeting: number
  premium: number
  welcome: number
}

export function keseAllowance(input: KeseInput): KeseAllowance {
  const tier = KESE_TIER_BASE[input.tier] ?? KESE_TIER_BASE.tuz
  const title = keseTitleBonus(input.level)
  const greeting = keseGreetingBonus(input.greetingPartners)
  const premium = input.premium ? KESE_PREMIUM_BONUS : 0
  const welcome = input.welcome ? KESE_WELCOME_GRANT : 0
  return {
    total: tier + title + greeting + premium + welcome,
    tier,
    title,
    greeting,
    premium,
    welcome,
  }
}

export interface KeseState {
  /** Kept so a surface can name the tier and title the allowance came from. */
  input: KeseInput
  allowance: KeseAllowance
  /** Messages sent this week, derived from the chat calls themselves. */
  spent: number
  remaining: number
  empty: boolean
  /** Monday of the current week, local YYYY-MM-DD. */
  weekStart: string
  /** When the kese refreshes; the empty screen counts down to this. */
  refreshesAt: Date
}

export function keseState(input: KeseInput, spent: number, now = new Date()): KeseState {
  const allowance = keseAllowance(input)
  const used = Math.max(0, Math.floor(spent)) * KESE_MESSAGE_COST
  const remaining = Math.max(0, allowance.total - used)
  return {
    input,
    allowance,
    spent: used,
    remaining,
    empty: remaining === 0,
    weekStart: keseWeekStart(now),
    refreshesAt: keseNextRefresh(now),
  }
}

function localISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Monday of the current week as a local YYYY-MM-DD.
 *
 * The client reads its own clock; the server settles the boundary in
 * Europe/Istanbul, which is the timezone the rhythm week already uses.
 */
export function keseWeekStart(now = new Date()): string {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return localISODate(monday)
}

/** Next Monday 00:00 local: the moment the kese refreshes. */
export function keseNextRefresh(now = new Date()): Date {
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + 7)
  return monday
}

/**
 * What the weekly allowance would be one tier up or down, level and greetings
 * held still. The league screen uses it to answer the question the whole
 * design exists for: what does climbing actually buy me.
 */
export function keseForTier(input: KeseInput, tier: LeagueTierKey): number {
  return keseAllowance({ ...input, tier }).total
}
