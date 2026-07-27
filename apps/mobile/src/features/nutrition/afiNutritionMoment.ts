import type { AfiMotion, AfiPoseName } from '@/ui/maskot'

/**
 * What Afi says on Beslenme.
 *
 * The Today note reads the whole day; this one only ever reads the plate. It
 * invites when nothing is logged, notices a meal slot that stayed empty long
 * after its hour, names what the plate is leaning on and celebrates a day
 * where all five core groups showed up. Water, energy and streaks belong to
 * other cards on other screens, so Afi stays quiet about them here.
 *
 * It never counts, never scolds and never dramatises a gap (BRAND.md voice
 * rules): a missing group is an invitation, not a verdict.
 *
 * Everything true right now is collected in the order it should be read, and
 * the note cycles through it. The conditions are written to be independent, so
 * two moments in the same list can never contradict each other.
 *
 * Pure on purpose: the whole set is decided here so every state can be unit
 * tested, and the screen only renders what comes back.
 */

/** Accent family for the note; mirrors the accents used on Today. */
export type AfiNutritionAccent = 'emerald' | 'amber'

export interface AfiNutritionMoment {
  /** Stable id: React key and tests both read this. */
  key: string
  pose: AfiPoseName
  motion: AfiMotion
  line: string
  accent: AfiNutritionAccent
  /** The one thing worth doing right now, or null when Afi only celebrates. */
  action: 'food' | null
}

/**
 * Only what a moment needs from a logged food. A `MealEntry` from
 * `mealRepo.forDay` satisfies this as-is, and so does a plain test fixture.
 */
export interface AfiNutritionEntry {
  meal: string
  groups: readonly string[]
}

export interface AfiNutritionMomentInput {
  /** Local hour, 0-23. */
  hour: number
  /** Everything logged today (`mealRepo.forDay`). */
  entries: readonly AfiNutritionEntry[]
  /**
   * Core food groups still open today, straight from
   * `summary.nutrition.balance.missing`. Empty means all five are covered, so
   * it must only be passed once the summary has actually arrived.
   */
  missingGroups: readonly string[]
}

/**
 * How each core group is invited to the table (dative). Written out per group
 * because Turkish suffixes do not survive being generated from the label.
 */
const GROUP_INVITE: Record<string, string> = {
  sebze: 'sebzeye',
  meyve: 'meyveye',
  protein: 'proteine',
  tahil: 'tahıla',
  sut: 'süt ürününe',
}

/** How a group is named as the subject of a sentence (nominative, lower case). */
const GROUP_NAME: Record<string, string> = {
  sebze: 'sebze',
  meyve: 'meyve',
  protein: 'protein',
  tahil: 'tahıl',
  sut: 'süt ürünü',
  bakliyat: 'bakliyat',
  yag: 'sağlıklı yağ',
  kuruyemis: 'kuruyemiş',
  hamurisi: 'hamur işi',
  icecek: 'içecek',
  tatli: 'tatlı',
  fastfood: 'fast food',
}

/**
 * The hour after which an empty meal slot stops reading as "not yet" and
 * starts reading as "probably logged somewhere else, or not at all".
 *
 * Ordered by hour: the last window that matches is the most recent one, which
 * is the one worth mentioning. Snacks ('ara') have no hour of their own and
 * are therefore never missed.
 */
const MEAL_WINDOWS: { meal: string; subject: string; from: number }[] = [
  { meal: 'kahvalti', subject: 'Kahvaltı', from: 11 },
  { meal: 'ogle', subject: 'Öğle yemeği', from: 15 },
  { meal: 'aksam', subject: 'Akşam yemeği', from: 21 },
]

/** Below this the plate is too small for one group to be leaning on it. */
const LEAN_MIN_TAGS = 3
/** And a single food is never a lean, however alone it stands. */
const LEAN_MIN_COUNT = 2

/** Midday is the safe reading of an hour that arrived broken. */
const clampHour = (value: number) =>
  Number.isFinite(value) ? Math.min(23, Math.max(0, Math.floor(value))) : 12

/** How many foods carried each group today; a food counts once per group. */
function countGroups(entries: readonly AfiNutritionEntry[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    for (const group of new Set(entry.groups)) {
      if (group) counts.set(group, (counts.get(group) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * The group more than half of today's plate leans on, or null when the plate
 * is either too small to have a shape or spread widely enough not to lean.
 */
function leaningGroup(entries: readonly AfiNutritionEntry[]): string | null {
  const counts = countGroups(entries)
  let total = 0
  let top = ''
  let topCount = 0

  for (const [group, count] of counts) {
    total += count
    if (count > topCount) {
      top = group
      topCount = count
    }
  }

  if (total < LEAN_MIN_TAGS || topCount < LEAN_MIN_COUNT) return null
  // Strictly more than half, which also makes the leaning group unique.
  return topCount * 2 > total ? top : null
}

/** The most recent meal slot that is past its hour and still has nothing in it. */
function missedMeal(entries: readonly AfiNutritionEntry[], hour: number) {
  const logged = new Set(entries.map((entry) => entry.meal))
  let missed: (typeof MEAL_WINDOWS)[number] | null = null
  for (const window of MEAL_WINDOWS) {
    if (hour >= window.from && !logged.has(window.meal)) missed = window
  }
  return missed
}

/**
 * Everything Afi can truthfully say about today's plate, in reading order.
 *
 * Never empty: there is always either an invitation, an observation or a
 * celebration to make about a nutrition screen.
 */
export function buildNutritionMoments(input: AfiNutritionMomentInput): AfiNutritionMoment[] {
  const hour = clampHour(input.hour)
  const entries = input.entries.filter((entry) => !!entry)
  /* Unknown group keys still count as a gap (the catalogue can grow ahead of a
     shipped build), they just cannot be named in the invitation. */
  const missing = input.missingGroups.filter((group) => !!group)

  // An empty day has exactly one thing to say, and it is an invitation.
  if (entries.length === 0) {
    return [
      {
        key: 'sofra-bos',
        pose: 'kasik',
        motion: 'idle',
        line: 'Bugün sofran daha kurulmadı. İlk besini birlikte ekleyelim mi? 🍲',
        accent: 'emerald',
        action: 'food',
      },
    ]
  }

  const moments: AfiNutritionMoment[] = []

  // Every core group made it to the plate. That leads, whatever else is true.
  if (missing.length === 0) {
    moments.push({
      key: 'denge-guzel',
      pose: 'kutlama',
      motion: 'zipla',
      line: 'Beş grup da bugün sofranda buluştu. Afiyet olsun! 🌟',
      accent: 'emerald',
      // A finished plate asks for nothing; the note reads instead of inviting.
      action: null,
    })
  }

  // A slot that is well past its hour and still empty is worth asking about.
  const missed = missedMeal(entries, hour)
  if (missed) {
    moments.push({
      key: 'ogun-bosluk',
      pose: 'merak',
      motion: 'idle',
      line: `${missed.subject} sofrada görünmüyor. Ne yediysen buraya bırakabilirsin 🍲`,
      accent: 'amber',
      action: 'food',
    })
  }

  // What the plate leans on, named next to what is still open. Only one of the
  // two notes below can be true, so the list never argues with itself.
  const invite = missing.map((group) => GROUP_INVITE[group]).find(Boolean)
  const leaning = missing.length > 0 ? leaningGroup(entries) : null
  const leaningName = leaning ? GROUP_NAME[leaning] : undefined

  if (leaningName) {
    moments.push({
      key: 'tek-grup',
      pose: 'dusunuyor',
      motion: 'nefes',
      line: invite
        ? `Bugün sofranda en çok ${leaningName} var. Bir de ${invite} yer açılır mı? 🌿`
        : `Bugün sofranda en çok ${leaningName} var. Tabağa bir renk daha eklemeye ne dersin? 🌿`,
      accent: 'emerald',
      action: 'food',
    })
  } else if (missing.length > 0) {
    moments.push({
      key: 'eksik-grup',
      pose: 'temel',
      motion: 'nefes',
      line: invite
        ? `Bugün sofrada ${invite} yer açılır mı? 🌿`
        : 'Bugün tabağa bir renk daha eklemeye ne dersin? 🌿',
      accent: 'emerald',
      action: 'food',
    })
  }

  return moments
}
