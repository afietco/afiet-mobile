import { MINOR_NOTE, ageFromBirthDate, bmr, bodyFatPercent, fiberGrams } from './bodyMetrics'
import type { ActivityLevel, GoalDirection, Sex } from './types'

/**
 * Goal engine behind the "Hedeflerim" screen (docs/hedeflerim.md).
 *
 * Pure calculation: no I/O, no React, no react-native. Every number that leaves
 * this module is a range, because the underlying estimate carries a double digit
 * error margin and a single number would be false precision (doc section 11).
 *
 * Two values are deliberately absent from `GoalsResult` even though the engine
 * can compute both: the target weight range (`targetWeightRange`, doc sections 2
 * and 12) and the implied weekly weight change (`CalorieTargetResolution`,
 * doc section 12 forbids duration promises). They exist as intermediate values
 * only and must never reach the screen.
 */

// ---------------------------------------------------------------------------
// Ranges
// ---------------------------------------------------------------------------

/** Closed interval. Named `GoalRange` so it never collides with the DOM `Range`. */
export interface GoalRange {
  min: number
  max: number
}

export function goalRangeMid(range: GoalRange): number {
  return (range.min + range.max) / 2
}

const EPSILON = 1e-9

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ---------------------------------------------------------------------------
// Section 3: direction set
// ---------------------------------------------------------------------------

// `GoalDirection` itself lives in `types.ts` next to the dated storage row; the
// section 3 table below (energy adjustment and protein band) belongs here.

/** Direction of a user who has not chosen one yet (doc section 3 and 8). */
export const DEFAULT_GOAL_DIRECTION: GoalDirection = 'duzen'

export interface GoalDirectionMeta {
  key: GoalDirection
  /** Option copy from the doc table; the screen may reword, the key may not drift. */
  label: string
  /**
   * How the direction moves energy away from maintenance.
   * `deficitRate` follows section 4.4 and therefore reacts to the energy
   * priority; `fixed` directions carry the constant from the section 3 table.
   */
  energySource: 'deficitRate' | 'fixed'
  /** Signed fraction of maintenance, used when `energySource` is `fixed`. */
  fixedEnergyFraction: number
  /** Protein grams per kg of fat free mass (section 3 table). */
  proteinPerKgFfm: GoalRange
}

export const GOAL_DIRECTIONS: GoalDirectionMeta[] = [
  {
    key: 'hafifle',
    label: 'Daha hafif hissetmek istiyorum',
    energySource: 'deficitRate',
    fixedEnergyFraction: 0,
    proteinPerKgFfm: { min: 1.8, max: 2.2 },
  },
  {
    key: 'donusum',
    label: 'Kilom değişmeden daha iyi hissetmek istiyorum',
    energySource: 'fixed',
    fixedEnergyFraction: -0.03,
    proteinPerKgFfm: { min: 2.0, max: 2.4 },
  },
  {
    key: 'koru',
    label: 'Olduğum yerde iyiyim',
    energySource: 'fixed',
    fixedEnergyFraction: 0,
    proteinPerKgFfm: { min: 1.4, max: 1.8 },
  },
  {
    key: 'duzen',
    label: 'Önce bir düzen kurayım',
    energySource: 'fixed',
    fixedEnergyFraction: 0,
    proteinPerKgFfm: { min: 1.4, max: 1.6 },
  },
]

export function goalDirectionMeta(direction: GoalDirection): GoalDirectionMeta {
  return GOAL_DIRECTIONS.find((d) => d.key === direction)!
}

/**
 * Protein band used when fat free mass is unknown; coefficients drop and the
 * base becomes total body weight (section 3). Direction no longer differentiates
 * protein in this branch, exactly as the doc words it.
 */
export const WEIGHT_BASED_PROTEIN_PER_KG: GoalRange = { min: 1.2, max: 1.6 }

// ---------------------------------------------------------------------------
// Section 4.1: composition
// ---------------------------------------------------------------------------

export interface BodyMeasurements {
  waistCm?: number
  neckCm?: number
  hipCm?: number
}

export interface BodyComposition {
  /** US Navy body fat as a fraction (0.24), or null when measurements are missing. */
  bodyFatFraction: number | null
  /** Fat free mass in kg, or null. No measurements means no FFM (section 4.1). */
  ffmKg: number | null
}

/** Body fat values outside this band are treated as a bad measurement, not a body. */
export const PLAUSIBLE_BODY_FAT_PERCENT: GoalRange = { min: 3, max: 70 }

/**
 * FFM = weight x (1 - BF). Body fat comes from the existing US Navy
 * implementation in `bodyMetrics`; this function does not reimplement it.
 */
export function bodyComposition(params: {
  sex: Sex
  heightCm: number
  weightKg: number
  measurements?: BodyMeasurements
}): BodyComposition {
  const { sex, heightCm, weightKg, measurements } = params
  const waistCm = measurements?.waistCm
  const neckCm = measurements?.neckCm
  const hipCm = measurements?.hipCm
  if (waistCm == null || neckCm == null) return { bodyFatFraction: null, ffmKg: null }

  const percent = bodyFatPercent(sex, heightCm, waistCm, neckCm, hipCm)
  if (
    percent == null ||
    !Number.isFinite(percent) ||
    percent < PLAUSIBLE_BODY_FAT_PERCENT.min ||
    percent > PLAUSIBLE_BODY_FAT_PERCENT.max
  ) {
    return { bodyFatFraction: null, ffmKg: null }
  }

  const fraction = percent / 100
  return { bodyFatFraction: fraction, ffmKg: weightKg * (1 - fraction) }
}

// ---------------------------------------------------------------------------
// Section 4.2: basal
// ---------------------------------------------------------------------------

export type BasalSource = 'katch' | 'mifflin'

export interface BasalEnergy {
  kcal: number
  source: BasalSource
}

/** Katch-McArdle: 370 + 21.6 x FFM. Needs neither sex nor age. */
export function katchMcArdleBmr(ffmKg: number): number {
  return 370 + 21.6 * ffmKg
}

/** Katch-McArdle when fat free mass is known, the existing Mifflin otherwise. */
export function basalEnergy(params: {
  sex: Sex
  weightKg: number
  heightCm: number
  ageYears: number
  ffmKg: number | null
}): BasalEnergy {
  const { sex, weightKg, heightCm, ageYears, ffmKg } = params
  if (ffmKg != null && ffmKg > 0) return { kcal: katchMcArdleBmr(ffmKg), source: 'katch' }
  return { kcal: bmr(sex, weightKg, heightCm, ageYears), source: 'mifflin' }
}

// ---------------------------------------------------------------------------
// Section 4.3: energy
// ---------------------------------------------------------------------------

/** PAL as a range per activity level; midpoints stay close to the legacy multipliers. */
export const PAL_RANGES: Record<ActivityLevel, GoalRange> = {
  hareketsiz: { min: 1.2, max: 1.35 },
  az: { min: 1.35, max: 1.5 },
  orta: { min: 1.5, max: 1.65 },
  aktif: { min: 1.65, max: 1.8 },
  cok_aktif: { min: 1.8, max: 1.95 },
}

/** Widest honest span when the activity level was never answered. */
export const UNKNOWN_ACTIVITY_PAL_RANGE: GoalRange = { min: 1.2, max: 1.95 }

/** Thermic effect of food, the last term of the movement formula (section 4.3). */
export const THERMIC_EFFECT_RATE = 0.1

/**
 * Band applied around the movement based point estimate so that this branch also
 * returns a range. The doc gives a point formula; a zero width range would be the
 * false precision section 11 warns about.
 */
export const MOVEMENT_ENERGY_UNCERTAINTY = 0.05

/**
 * Post-beta input from HealthKit / Health Connect. Present means the activity
 * multiplier is bypassed entirely; applying both double counts movement
 * (section 4.3 and the section 12 "Yapma" list).
 */
export interface MovementEnergyInput {
  /** Average daily active energy in kcal over the last 7 to 14 days. */
  activeKcalPerDay: number
}

export type EnergySource = 'activity' | 'movement'

export interface MaintenanceEnergy {
  range: GoalRange
  source: EnergySource
}

/**
 * Daily maintenance energy. With movement data the activity level is not read at
 * all: `TDEE = BMR + active + BMR x 0.10`.
 */
export function maintenanceEnergy(params: {
  basalKcal: number
  activityLevel?: ActivityLevel | null
  movement?: MovementEnergyInput | null
}): MaintenanceEnergy {
  const { basalKcal, movement } = params

  if (movement != null && Number.isFinite(movement.activeKcalPerDay)) {
    const active = Math.max(0, movement.activeKcalPerDay)
    const point = basalKcal + active + basalKcal * THERMIC_EFFECT_RATE
    return {
      range: {
        min: point * (1 - MOVEMENT_ENERGY_UNCERTAINTY),
        max: point * (1 + MOVEMENT_ENERGY_UNCERTAINTY),
      },
      source: 'movement',
    }
  }

  const pal = params.activityLevel ? PAL_RANGES[params.activityLevel] : UNKNOWN_ACTIVITY_PAL_RANGE
  return { range: { min: basalKcal * pal.min, max: basalKcal * pal.max }, source: 'activity' }
}

// ---------------------------------------------------------------------------
// Section 4.4: calorie target
// ---------------------------------------------------------------------------

/** Energy priority E is not asked during beta; it is fixed at 0.5 (section 4.4). */
export const BETA_ENERGY_PRIORITY = 0.5

/** DeficitRate = 0.15 - 0.08 x E, so 7% at E = 1 and 15% at E = 0. */
export function deficitRate(energyPriority: number = BETA_ENERGY_PRIORITY): number {
  const e = clamp(Number.isFinite(energyPriority) ? energyPriority : BETA_ENERGY_PRIORITY, 0, 1)
  return 0.15 - 0.08 * e
}

/** Signed fraction of maintenance the chosen direction asks for, before any gate. */
export function directionEnergyAdjustment(
  direction: GoalDirection,
  energyPriority: number = BETA_ENERGY_PRIORITY,
): number {
  const meta = goalDirectionMeta(direction)
  return meta.energySource === 'deficitRate'
    ? -deficitRate(energyPriority)
    : meta.fixedEnergyFraction
}

/** Weekly body weight change ceiling as a fraction of body weight (section 4.4). */
export const DEFAULT_WEEKLY_CHANGE_RATIO = 0.0075

/** Hard ceiling of section 9; a caller may lower the cap, never raise it past this. */
export const MAX_WEEKLY_CHANGE_RATIO = 0.01

/** Energy equivalent of one kg of body mass, the classic approximation. */
export const KCAL_PER_KG_BODY_MASS = 7700

/** Section 9 floors; no target below these is ever produced. */
export const CALORIE_FLOOR_KCAL: Record<Sex, number> = { kadin: 1200, erkek: 1500 }

// ---------------------------------------------------------------------------
// Section 4.5: macro order
// ---------------------------------------------------------------------------

export const KCAL_PER_GRAM = { protein: 4, carb: 4, fat: 9 } as const

/** Hormone health floor; the fat target never drops under this (section 4.5). */
export const FAT_FLOOR_PER_KG = 0.6

/** Fat also never drops under this share of the calorie target. */
export const FAT_MIN_ENERGY_SHARE = 0.25

export function fatGrams(kcal: number, weightKg: number): number {
  return Math.max(
    FAT_FLOOR_PER_KG * weightKg,
    (kcal * FAT_MIN_ENERGY_SHARE) / KCAL_PER_GRAM.fat,
  )
}

export interface MacroSplit {
  protein: number
  fat: number
  carb: number
}

/**
 * Macros in the order the doc fixes: protein from body composition, fat from its
 * floor, carbohydrate as the pure remainder. The carbohydrate value is returned
 * as computed, negative included; gating it is the caller's job so that the
 * deficit can be shrunk instead of the floor being breached.
 */
export function macroSplit(kcal: number, proteinG: number, weightKg: number): MacroSplit {
  const fat = fatGrams(kcal, weightKg)
  const carb =
    (kcal - proteinG * KCAL_PER_GRAM.protein - fat * KCAL_PER_GRAM.fat) / KCAL_PER_GRAM.carb
  return { protein: proteinG, fat, carb }
}

/**
 * Smallest calorie target that still leaves room for a non negative
 * carbohydrate remainder. Solved exactly: the remainder grows monotonically with
 * the calorie target, with one slope while the fat floor binds and another once
 * the 25% share takes over.
 */
export function minKcalForNonNegativeCarb(proteinG: number, weightKg: number): number {
  const proteinKcal = proteinG * KCAL_PER_GRAM.protein
  const fatFloorKcal = FAT_FLOOR_PER_KG * weightKg * KCAL_PER_GRAM.fat
  const shareTakesOverAt = fatFloorKcal / FAT_MIN_ENERGY_SHARE
  const withFatFloor = proteinKcal + fatFloorKcal
  if (withFatFloor <= shareTakesOverAt) return withFatFloor
  return proteinKcal / (1 - FAT_MIN_ENERGY_SHARE)
}

// ---------------------------------------------------------------------------
// Section 9: safety rails
// ---------------------------------------------------------------------------

export type GoalSafetyRail =
  /** Under 18: balance language only, no target at all. */
  | 'minor'
  /** 1200 kcal for women, 1500 for men. */
  | 'calorie_floor'
  /** Weekly change cap; the deficit shrinks, the cap never grows. */
  | 'weekly_change_cap'
  /** Pregnancy or breastfeeding declaration: no deficit target. */
  | 'no_deficit_declaration'
  /** Kidney condition declaration: no high protein recommendation. */
  | 'kidney_protein_cap'
  /** Rapid change plus a very low target plus frequent weighing. */
  | 'rapid_change_pattern'
  /** Deficit shrunk so the carbohydrate remainder stays non negative. */
  | 'carbohydrate_floor'

/**
 * Declarations the engine acts on. None of these exist on `Profile` today and
 * the UI does not collect them yet; they are accepted as engine input so the
 * rails are written, tested and ready the day the questions are asked.
 */
export interface HealthDeclarations {
  pregnant?: boolean
  breastfeeding?: boolean
  kidneyCondition?: boolean
}

/**
 * Recent behaviour pattern for the pull back rail. Also not on `Profile`; the
 * caller derives it from measurements. `weeklyChangeKg` must come from a 7 day
 * trend, never from a raw daily reading (doc section 4.7).
 */
export interface RecentPattern {
  /** Signed weekly body weight change in kg; negative means loss. */
  weeklyChangeKg?: number
  /** Days of the last week that carried a weigh in. */
  weighInDaysPerWeek?: number
}

/** Loss faster than 1% of body weight per week counts as rapid. */
export const RAPID_CHANGE_WEEKLY_RATIO = 0.01

/** Weighing in on this many days of a week counts as frequent. */
export const FREQUENT_WEIGH_IN_DAYS = 5

/** A target within this margin above the sex floor counts as very low. */
export const LOW_TARGET_FLOOR_MARGIN = 0.1

/**
 * The section 9 pull back pattern. All three signals must be present: rapid
 * loss, a very low target and frequent weighing. Any one of them alone is
 * normal behaviour and must not trigger a warning.
 */
export function isRapidChangePattern(params: {
  weightKg: number
  targetKcal: number
  floorKcal: number
  pattern?: RecentPattern | null
}): boolean {
  const { weightKg, targetKcal, floorKcal, pattern } = params
  if (!pattern) return false
  const weeklyChangeKg = pattern.weeklyChangeKg
  const weighInDays = pattern.weighInDaysPerWeek
  if (weeklyChangeKg == null || weighInDays == null) return false

  const rapidLoss = weeklyChangeKg <= -(weightKg * RAPID_CHANGE_WEEKLY_RATIO)
  const veryLowTarget = targetKcal <= floorKcal * (1 + LOW_TARGET_FLOOR_MARGIN)
  const weighsOften = weighInDays >= FREQUENT_WEIGH_IN_DAYS
  return rapidLoss && veryLowTarget && weighsOften
}

/**
 * Conservative protein band under a declared kidney condition, on total body
 * weight rather than fat free mass. Section 9 forbids a high protein
 * recommendation there.
 */
export const KIDNEY_SAFE_PROTEIN_PER_KG: GoalRange = { min: 0.6, max: 0.8 }

// ---------------------------------------------------------------------------
// Calorie target resolution
// ---------------------------------------------------------------------------

export interface CalorieTargetInput {
  sex: Sex
  weightKg: number
  /** Maintenance energy the target is measured against; use the range midpoint. */
  maintenanceKcal: number
  /** Signed fraction the direction asked for, before any gate. */
  requestedAdjustment: number
  /**
   * Protein grams the carbohydrate gate must leave room for. Pass the top of the
   * protein range so the gate holds across the whole range.
   */
  proteinG: number
  /** True when a section 9 declaration or pattern forbids any deficit. */
  deficitForbidden?: boolean
  /** Defaults to 0.75% of body weight, hard clamped to the 1% ceiling. */
  weeklyChangeCapRatio?: number
}

export interface CalorieTargetResolution {
  kcal: number
  requestedAdjustment: number
  /** Signed fraction actually applied after every gate. */
  appliedAdjustment: number
  weeklyChangeCapKg: number
  /**
   * Intermediate diagnostic only. Never render it and never derive a date from
   * it; section 12 forbids duration promises.
   */
  impliedWeeklyChangeKg: number
  rails: GoalSafetyRail[]
}

/**
 * Applies every hard gate of sections 4.4, 4.5 and 9 to one calorie target.
 * Gate order matters: forbidden deficit, weekly change cap, calorie floor,
 * carbohydrate remainder. Each gate can only shrink the deficit or raise the
 * target; none of them relaxes another.
 */
export function resolveCalorieTarget(input: CalorieTargetInput): CalorieTargetResolution {
  const { sex, weightKg, maintenanceKcal, requestedAdjustment, proteinG } = input
  const rails: GoalSafetyRail[] = []
  const floorKcal = CALORIE_FLOOR_KCAL[sex]

  const requestedCapRatio = input.weeklyChangeCapRatio ?? DEFAULT_WEEKLY_CHANGE_RATIO
  const capRatio = clamp(requestedCapRatio, 0, MAX_WEEKLY_CHANGE_RATIO)
  const weeklyChangeCapKg = weightKg * capRatio
  const maxDailyDeltaKcal = (weeklyChangeCapKg * KCAL_PER_KG_BODY_MASS) / 7

  let adjustment = requestedAdjustment

  if (input.deficitForbidden && adjustment < 0) {
    adjustment = 0
    rails.push('no_deficit_declaration')
  }

  const requestedDeltaKcal = maintenanceKcal * adjustment
  if (Math.abs(requestedDeltaKcal) > maxDailyDeltaKcal + EPSILON) {
    const sign = requestedDeltaKcal < 0 ? -1 : 1
    adjustment = (sign * maxDailyDeltaKcal) / maintenanceKcal
    rails.push('weekly_change_cap')
  }

  if (adjustment < 0 && maintenanceKcal * (1 + adjustment) < floorKcal - EPSILON) {
    const floorAdjustment = floorKcal / maintenanceKcal - 1
    adjustment = Math.min(Math.max(adjustment, floorAdjustment), 0)
    rails.push('calorie_floor')
  }

  let kcal = maintenanceKcal * (1 + adjustment)
  if (kcal < floorKcal - EPSILON) {
    kcal = floorKcal
    if (!rails.includes('calorie_floor')) rails.push('calorie_floor')
  }

  const requiredKcal = minKcalForNonNegativeCarb(proteinG, weightKg)
  if (kcal < requiredKcal - EPSILON) {
    // Shrink the deficit, at most up to maintenance. The fat floor is never
    // touched and the carbohydrate remainder is never allowed to fund it.
    kcal = Math.max(kcal, Math.min(requiredKcal, maintenanceKcal))
    rails.push('carbohydrate_floor')
  }

  const appliedAdjustment = kcal / maintenanceKcal - 1
  const impliedWeeklyChangeKg = ((kcal - maintenanceKcal) * 7) / KCAL_PER_KG_BODY_MASS

  return {
    kcal,
    requestedAdjustment,
    appliedAdjustment,
    weeklyChangeCapKg,
    impliedWeeklyChangeKg,
    rails,
  }
}

// ---------------------------------------------------------------------------
// Section 4.6: hand measures
// ---------------------------------------------------------------------------

export type HandMeasureKey = 'protein' | 'vegetable' | 'grain' | 'fat'

/**
 * Blog vocabulary (`porsiyon-olculeri-el-olcusu`). Section 12 forbids drifting
 * from it, so the four terms are a type: "çukur avuç" cannot compile.
 */
export type HandTerm = 'avuç içi' | 'yumruk' | 'kapalı avuç' | 'başparmak'

export const HAND_TERMS: Record<HandMeasureKey, HandTerm> = {
  protein: 'avuç içi',
  vegetable: 'yumruk',
  grain: 'kapalı avuç',
  fat: 'başparmak',
}

/** Grams one hand unit stands for, per sex (section 4.6 table). */
export const HAND_GRAMS_PER_UNIT: Record<Sex, { protein: number; grain: number; fat: number }> = {
  kadin: { protein: 22, grain: 25, fat: 10 },
  erkek: { protein: 28, grain: 30, fat: 12 },
}

/**
 * Share of the daily carbohydrate that is expected to arrive as grain and
 * starch portions, which is what a cupped hand actually measures.
 *
 * Dividing the WHOLE carbohydrate target by the per-portion figure treats
 * fruit, vegetables, dairy and legumes as if they were bread, and produced
 * readings like "13-14 kapalı avuç" for an ordinary day. A cupped hand is an
 * instruction about the starch on the plate, not an accounting of every gram
 * of carbohydrate eaten.
 */
export const GRAIN_CARB_SHARE = 0.55

/**
 * Share of the daily fat that is expected to arrive as added fat: oil, butter,
 * nuts, the things a thumb measures. The rest rides inside protein foods and
 * dairy and is never served by the spoonful, so counting it in thumbs
 * overstated the reading the same way.
 */
export const ADDED_FAT_SHARE = 0.45

/** Vegetables are expected to carry this share of the daily fiber target. */
export const VEGETABLE_FIBER_SHARE = 0.4

/** Fiber one fist of vegetables delivers, in grams. */
export const FIBER_PER_VEGETABLE_FIST_G = 3

/** Floor from the section 4.6 table. */
export const MIN_VEGETABLE_FISTS = 3

/** Values this close to a whole number are read as that whole number. */
export const HAND_COUNT_SNAP = 0.15

export interface HandCount {
  min: number
  max: number
}

/**
 * Rounding by range, never by decimals (section 4.6): 3.4 becomes 3-4, never
 * 3.5. Values that sit on a whole number collapse to a single count, and the
 * lower bound never drops below one.
 */
export function handCountRange(value: number): HandCount {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0
  const nearest = Math.round(safe)
  if (Math.abs(safe - nearest) <= HAND_COUNT_SNAP) {
    const single = Math.max(1, nearest)
    return { min: single, max: single }
  }
  const min = Math.max(1, Math.floor(safe))
  const max = Math.max(min, Math.ceil(safe))
  return { min, max }
}

/** "3-4" for a range, "3" for a single count. Never a decimal. */
export function formatHandCount(count: HandCount): string {
  return count.min === count.max ? `${count.min}` : `${count.min}-${count.max}`
}

export interface HandMeasure {
  key: HandMeasureKey
  term: HandTerm
  count: HandCount
  /** Ready to read amount plus term, for example "3-4 avuç içi". */
  text: string
}

function handMeasure(key: HandMeasureKey, value: number): HandMeasure {
  const count = handCountRange(value)
  const term = HAND_TERMS[key]
  return { key, term, count, text: `${formatHandCount(count)} ${term}` }
}

/**
 * The four hand measures in screen order. Vegetables derive from the fiber
 * target with a floor of three fists; the other three divide the macro target by
 * the per sex coefficient.
 */
export function handMeasures(params: {
  sex: Sex
  proteinG: number
  carbG: number
  fatG: number
  fiberG: number
}): HandMeasure[] {
  const units = HAND_GRAMS_PER_UNIT[params.sex]
  const vegetableFists = Math.max(
    MIN_VEGETABLE_FISTS,
    (params.fiberG * VEGETABLE_FIBER_SHARE) / FIBER_PER_VEGETABLE_FIST_G,
  )
  return [
    handMeasure('protein', params.proteinG / units.protein),
    handMeasure('vegetable', vegetableFists),
    /* Only the starch share is served in cupped hands, and only added fat is
       served in thumbs. See the two share constants for why the totals cannot
       be used directly. */
    handMeasure('grain', (Math.max(0, params.carbG) * GRAIN_CARB_SHARE) / units.grain),
    handMeasure('fat', (params.fatG * ADDED_FAT_SHARE) / units.fat),
  ]
}

// ---------------------------------------------------------------------------
// Section 11: corrected target weight range
// ---------------------------------------------------------------------------

/**
 * W = FFM / (1 - BF), so a higher body fat share means a higher weight. The
 * external document inverted the bounds; this is the corrected form.
 *
 * Intermediate value only: target weight is never asked and never displayed
 * (doc sections 2 and 12), which is why it is not part of `GoalsResult`.
 */
export function targetWeightRange(ffmKg: GoalRange, bodyFatFraction: GoalRange): GoalRange {
  return {
    min: ffmKg.min / (1 - bodyFatFraction.min),
    max: ffmKg.max / (1 - bodyFatFraction.max),
  }
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export type GoalConfidence = 'low' | 'medium' | 'high'

export type GoalInputKey = 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activityLevel'

export interface GoalsInput {
  sex?: Sex
  /** Either an age in whole years, or a birth date the engine converts. */
  ageYears?: number
  /** YYYY-MM-DD. Used only when `ageYears` is absent. */
  birthDate?: string
  /** Reference day for `birthDate`. Pass it to keep the call deterministic. */
  today?: Date
  heightCm?: number
  weightKg?: number
  activityLevel?: ActivityLevel
  measurements?: BodyMeasurements
  /** Absent means the user has not chosen; the engine falls back to `duzen`. */
  direction?: GoalDirection
  /** Energy priority E; beta does not ask and leaves it at 0.5. */
  energyPriority?: number
  /** Post-beta movement data; present bypasses the activity multiplier. */
  movement?: MovementEnergyInput | null
  /** Not collected by the UI yet; see `HealthDeclarations`. */
  declarations?: HealthDeclarations
  /** Not collected by the UI yet; see `RecentPattern`. */
  recentPattern?: RecentPattern
  /** Optional override, clamped to the 1% weekly ceiling. */
  weeklyChangeCapRatio?: number
}

export interface GoalTarget {
  /** Daily calorie target as a range, floors already applied. */
  range: GoalRange
  mid: number
  /** What the direction asked for, before the gates. */
  requestedAdjustment: number
  /** What survived the gates. */
  appliedAdjustment: number
}

export interface GoalMacros {
  /** Daily grams. */
  protein: GoalRange
  fat: GoalRange
  carb: GoalRange
  fiber: GoalRange
  /** Grams per kg of `proteinBase`. */
  proteinPerKg: GoalRange
  proteinBase: 'ffm' | 'weight'
}

export interface GoalsResult {
  direction: GoalDirection
  /** False when the fallback `duzen` is in play because nothing was chosen. */
  directionChosen: boolean
  confidence: GoalConfidence
  /** Short Turkish honesty line the screen may show as is. */
  confidenceNote: string
  /**
   * True while the user has not chosen a direction.
   *
   * It no longer mutes anything. The direction is asked during onboarding now,
   * so an unchosen one means the person skipped a question rather than that
   * they are early, and withholding every number until they answer left the
   * card reading "Referans hazırlanıyor" indefinitely. The silent `duzen`
   * default produces balanced targets, which is a truthful answer, and the
   * confidence note already says how firm it is.
   *
   * Kept as information for a screen that wants to invite the choice.
   */
  directionUnchosen: boolean
  /** True when section 9 forbids a target entirely (under 18, missing input). */
  targetsWithheld: boolean
  missingInputs: GoalInputKey[]
  composition: BodyComposition
  basal: BasalEnergy | null
  maintenance: MaintenanceEnergy | null
  target: GoalTarget | null
  macros: GoalMacros | null
  hand: HandMeasure[] | null
  rails: GoalSafetyRail[]
  notes: string[]
  /** Section 9: the engine makes no medical judgement and says so. */
  professionalSupportSuggested: boolean
}

/** Honesty anchor of the screen (doc section 5). */
export const GOAL_ESTIMATE_NOTE = 'Bu ölçüler şimdilik tahmin. Kayıt biriktikçe sana göre düzelteceğim.'

export const GOAL_MOVEMENT_NOTE = 'Bu ölçüler hareket verinle hesaplandı.'

export const GOAL_NO_DEFICIT_NOTE = 'Bu dönemde enerjini kısan bir ölçü kurmuyorum, dengede kalalım.'

export const GOAL_KIDNEY_NOTE = 'Protein ölçüsünü temkinli tuttum.'

export const GOAL_RAPID_CHANGE_NOTE =
  'Son günlerde ölçülerin hızlı değişiyor, ölçüleri biraz geri çektim. Acelesi yok.'

export const GOAL_PROFESSIONAL_SUPPORT_NOTE = 'Bunu bir sağlık uzmanıyla konuşmak iyi olur.'

/** Age of majority for the section 9 gate. */
export const ADULT_AGE_YEARS = 18

function resolveAgeYears(input: GoalsInput): number | null {
  if (input.ageYears != null && Number.isFinite(input.ageYears)) return input.ageYears
  if (input.birthDate) return ageFromBirthDate(input.birthDate, input.today ?? new Date())
  return null
}

function isPositive(value: number | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0
}

function emptyResult(params: {
  direction: GoalDirection
  directionChosen: boolean
  missingInputs: GoalInputKey[]
  composition: BodyComposition
  basal: BasalEnergy | null
  maintenance: MaintenanceEnergy | null
  rails: GoalSafetyRail[]
  notes: string[]
  professionalSupportSuggested: boolean
}): GoalsResult {
  return {
    direction: params.direction,
    directionChosen: params.directionChosen,
    confidence: 'low',
    confidenceNote: GOAL_ESTIMATE_NOTE,
    directionUnchosen: true,
    targetsWithheld: true,
    missingInputs: params.missingInputs,
    composition: params.composition,
    basal: params.basal,
    maintenance: params.maintenance,
    target: null,
    macros: null,
    hand: null,
    rails: params.rails,
    notes: params.notes,
    professionalSupportSuggested: params.professionalSupportSuggested,
  }
}

/**
 * The whole engine in one call. Returns ranges, the rails that fired and a
 * confidence level, and never a target weight or a duration.
 */
export function calculateGoals(input: GoalsInput): GoalsResult {
  const direction = input.direction ?? DEFAULT_GOAL_DIRECTION
  const directionChosen = input.direction != null
  const declarations = input.declarations ?? {}
  const rails: GoalSafetyRail[] = []
  const notes: string[] = []

  const ageYears = resolveAgeYears(input)
  const missingInputs: GoalInputKey[] = []
  if (!input.sex) missingInputs.push('sex')
  if (ageYears == null) missingInputs.push('age')
  if (!isPositive(input.heightCm)) missingInputs.push('heightCm')
  if (!isPositive(input.weightKg)) missingInputs.push('weightKg')
  /* Without it the maintenance range falls back to the widest plausible band
     and confidence drops, so it is genuinely missing input rather than an
     optional extra. Listing it here keeps every "what does Afi still need"
     question answerable from the engine alone. */
  if (!input.activityLevel) missingInputs.push('activityLevel')

  const emptyComposition: BodyComposition = { bodyFatFraction: null, ffmKg: null }
  /* Activity level is missing input for the acquaintance meter's purposes, but
     it does not block the calculation: without it the maintenance range simply
     widens. Everything below genuinely cannot be computed. */
  if (
    input.sex == null ||
    ageYears == null ||
    input.heightCm == null ||
    input.weightKg == null
  ) {
    return emptyResult({
      direction,
      directionChosen,
      missingInputs,
      composition: emptyComposition,
      basal: null,
      maintenance: null,
      rails,
      notes,
      professionalSupportSuggested: false,
    })
  }

  const sex = input.sex
  const weightKg = input.weightKg
  const heightCm = input.heightCm

  const composition = bodyComposition({
    sex,
    heightCm,
    weightKg,
    measurements: input.measurements,
  })
  const basal = basalEnergy({ sex, weightKg, heightCm, ageYears, ffmKg: composition.ffmKg })
  const maintenance = maintenanceEnergy({
    basalKcal: basal.kcal,
    activityLevel: input.activityLevel,
    movement: input.movement,
  })

  const ffmKnown = composition.ffmKg != null
  const movementUsed = maintenance.source === 'movement'
  const activityKnown = input.activityLevel != null
  let score = 0
  if (ffmKnown) score += 1
  if (movementUsed) score += 1
  if (!movementUsed && !activityKnown) score = 0
  const confidence: GoalConfidence = score >= 2 ? 'high' : score === 1 ? 'medium' : 'low'
  const confidenceNote = movementUsed ? GOAL_MOVEMENT_NOTE : GOAL_ESTIMATE_NOTE

  // Section 9: under 18 the engine produces no target at all, only balance
  // language. Composition and expenditure stay available as information.
  if (ageYears < ADULT_AGE_YEARS) {
    rails.push('minor')
    notes.push(MINOR_NOTE)
    return {
      ...emptyResult({
        direction,
        directionChosen,
        missingInputs,
        composition,
        basal,
        maintenance,
        rails,
        notes,
        professionalSupportSuggested: false,
      }),
      confidence,
      confidenceNote,
    }
  }

  // Protein first (section 4.5), because the carbohydrate gate needs it.
  const kidneyCondition = declarations.kidneyCondition === true
  const proteinPerKg = kidneyCondition
    ? KIDNEY_SAFE_PROTEIN_PER_KG
    : ffmKnown
      ? goalDirectionMeta(direction).proteinPerKgFfm
      : WEIGHT_BASED_PROTEIN_PER_KG
  const proteinBase: 'ffm' | 'weight' = !kidneyCondition && ffmKnown ? 'ffm' : 'weight'
  const proteinBaseKg = proteinBase === 'ffm' ? composition.ffmKg! : weightKg
  const proteinRange: GoalRange = {
    min: proteinPerKg.min * proteinBaseKg,
    max: proteinPerKg.max * proteinBaseKg,
  }
  if (kidneyCondition) {
    rails.push('kidney_protein_cap')
    notes.push(GOAL_KIDNEY_NOTE)
  }

  const maintenanceMid = goalRangeMid(maintenance.range)
  const requestedAdjustment = directionEnergyAdjustment(direction, input.energyPriority)
  const floorKcal = CALORIE_FLOOR_KCAL[sex]

  const expecting = declarations.pregnant === true || declarations.breastfeeding === true
  const provisionalKcal = maintenanceMid * (1 + requestedAdjustment)
  const rapidPattern = isRapidChangePattern({
    weightKg,
    targetKcal: provisionalKcal,
    floorKcal,
    pattern: input.recentPattern,
  })

  const resolution = resolveCalorieTarget({
    sex,
    weightKg,
    maintenanceKcal: maintenanceMid,
    requestedAdjustment,
    proteinG: proteinRange.max,
    deficitForbidden: expecting || rapidPattern,
    weeklyChangeCapRatio: input.weeklyChangeCapRatio,
  })
  for (const rail of resolution.rails) rails.push(rail)

  if (rapidPattern) {
    rails.push('rapid_change_pattern')
    notes.push(GOAL_RAPID_CHANGE_NOTE)
  }
  if (expecting) notes.push(GOAL_NO_DEFICIT_NOTE)

  const professionalSupportSuggested = expecting || kidneyCondition || rapidPattern
  if (professionalSupportSuggested) notes.push(GOAL_PROFESSIONAL_SUPPORT_NOTE)

  const applied = resolution.appliedAdjustment
  const kcalRange: GoalRange = {
    min: Math.max(floorKcal, maintenance.range.min * (1 + applied)),
    max: Math.max(floorKcal, maintenance.range.max * (1 + applied)),
  }
  if (
    maintenance.range.min * (1 + applied) < floorKcal - EPSILON &&
    !rails.includes('calorie_floor')
  ) {
    rails.push('calorie_floor')
  }

  const fatRange: GoalRange = {
    min: fatGrams(kcalRange.min, weightKg),
    max: fatGrams(kcalRange.max, weightKg),
  }
  // Interval arithmetic: the leanest carbohydrate remainder pairs the lowest
  // energy with the highest protein, and the other way around.
  const carbRange: GoalRange = {
    min: Math.max(0, macroSplit(kcalRange.min, proteinRange.max, weightKg).carb),
    max: Math.max(0, macroSplit(kcalRange.max, proteinRange.min, weightKg).carb),
  }
  const fiberRange: GoalRange = {
    min: fiberGrams(kcalRange.min),
    max: fiberGrams(kcalRange.max),
  }

  const macros: GoalMacros = {
    protein: proteinRange,
    fat: fatRange,
    carb: carbRange,
    fiber: fiberRange,
    proteinPerKg,
    proteinBase,
  }

  const hand = handMeasures({
    sex,
    proteinG: goalRangeMid(proteinRange),
    carbG: goalRangeMid(carbRange),
    fatG: goalRangeMid(fatRange),
    fiberG: goalRangeMid(fiberRange),
  })

  return {
    direction,
    directionChosen,
    confidence,
    confidenceNote,
    directionUnchosen: !directionChosen,
    targetsWithheld: false,
    missingInputs,
    composition,
    basal,
    maintenance,
    target: {
      range: kcalRange,
      mid: resolution.kcal,
      requestedAdjustment,
      appliedAdjustment: applied,
    },
    macros,
    hand,
    rails,
    notes,
    professionalSupportSuggested,
  }
}
