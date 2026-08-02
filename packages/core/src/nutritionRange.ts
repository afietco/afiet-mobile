/**
 * Reading a stretch of days rather than one day.
 *
 * "Bilgilerim" answers a different question from "Bugün". Today asks whether
 * the plate is balanced right now; this asks what the last few weeks look like
 * as a shape. That difference decides the whole vocabulary here:
 *
 *  - Everything is expressed as a SHARE of energy, not as a distance from a
 *    target. A share cannot be exceeded, so the numbers cannot turn into a
 *    verdict on the person. BRAND.md is explicit that a calorie is information
 *    and never a limit, and thirty "you hit 68% of target" days in a row would
 *    read as thirty small failures no matter how the label is worded.
 *  - The comparison is a BAND, not a point. The reference ranges already in
 *    MACRO_RANGES (20-30 / 45-55 / 25-35) are guidance with real width, and a
 *    calculation carrying a ±15% error margin has no business being presented
 *    to one decimal place (docs/hedeflerim.md § 4.6).
 *  - Days with nothing logged are NOT zeros. A day nobody recorded is a day we
 *    know nothing about; averaging it in as zero would invent a downward trend
 *    out of a gap in the record.
 *
 * Pure and platform free: the app draws these, the server will fill them.
 */
import { MACRO_RANGES, type MacroKey } from './bodyMetrics'

/** One day's nutrition as the server reports it. */
export interface NutritionDay {
  /** Local YYYY-MM-DD. */
  date: string
  kcal: number
  protein: number
  carb: number
  fat: number
  fiberG: number
  /** Entries whose macros are known, and those the catalogue could not match. */
  knownCount: number
  unknownCount: number
  /** Core food groups touched that day, 0 to 5. */
  balanceScore: number
  waterGlasses: number
}

/** Where a value sits against its reference band. */
export type BandPosition = 'below' | 'inside' | 'above'

export interface MacroShare {
  key: MacroKey
  /** Share of the window's energy, 0 to 1. */
  share: number
  /** Band edges, 0 to 1, straight from MACRO_RANGES. */
  min: number
  max: number
  position: BandPosition
}

export interface NutritionWindow {
  /** Days that actually carry a record; the rest are gaps, not zeros. */
  loggedDays: NutritionDay[]
  /** Days in the window with no record at all. */
  emptyDayCount: number
  /** Mean energy across logged days only. Null when nothing was logged. */
  averageKcal: number | null
  averageFiberG: number | null
  averageWaterGlasses: number | null
  /** Mean balance score across logged days, 0 to 5. Null when nothing was logged. */
  averageBalance: number | null
  /** Macro shares of the window, empty when nothing was logged. */
  shares: MacroShare[]
  /** How much of the window's food the catalogue could actually price. */
  knownCount: number
  unknownCount: number
}

/** A day counts as logged when something was actually recorded on it. */
export function isLoggedDay(day: NutritionDay): boolean {
  return day.knownCount + day.unknownCount > 0
}

function positionIn(share: number, min: number, max: number): BandPosition {
  if (share < min) return 'below'
  if (share > max) return 'above'
  return 'inside'
}

/**
 * Macro shares of total energy over the window.
 *
 * Computed from the summed grams rather than by averaging each day's share, so
 * a day with one cracker does not weigh as much as a full day. Returns an empty
 * list when there is no energy to divide by; a share of zero would claim
 * something the data does not say.
 */
export function macroShares(days: NutritionDay[]): MacroShare[] {
  const grams: Record<MacroKey, number> = { protein: 0, carb: 0, fat: 0 }
  for (const day of days) {
    grams.protein += day.protein
    grams.carb += day.carb
    grams.fat += day.fat
  }

  /* Energy is recomputed from the grams instead of summing `kcal`: the two can
     drift apart (alcohol, rounding) and a set of shares that does not add up to
     a whole would be drawn as a broken bar. */
  const totalKcal = (Object.keys(grams) as MacroKey[]).reduce(
    (total, key) => total + grams[key] * MACRO_RANGES[key].kcalPerG,
    0,
  )
  if (totalKcal <= 0) return []

  return (Object.keys(grams) as MacroKey[]).map((key) => {
    const share = (grams[key] * MACRO_RANGES[key].kcalPerG) / totalKcal
    const { pctMin, pctMax } = MACRO_RANGES[key]
    return { key, share, min: pctMin, max: pctMax, position: positionIn(share, pctMin, pctMax) }
  })
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((total, value) => total + value, 0) / values.length
}

/** Folds a range of days into the summary the screen reads. */
export function summarizeNutritionWindow(days: NutritionDay[]): NutritionWindow {
  const logged = days.filter(isLoggedDay)
  return {
    loggedDays: logged,
    emptyDayCount: days.length - logged.length,
    averageKcal: mean(logged.map((day) => day.kcal)),
    averageFiberG: mean(logged.map((day) => day.fiberG)),
    averageWaterGlasses: mean(logged.map((day) => day.waterGlasses)),
    averageBalance: mean(logged.map((day) => day.balanceScore)),
    shares: macroShares(logged),
    knownCount: logged.reduce((total, day) => total + day.knownCount, 0),
    unknownCount: logged.reduce((total, day) => total + day.unknownCount, 0),
  }
}

export interface TrendPoint {
  date: string
  /** Null on a day with no record; the line skips it rather than dipping. */
  value: number | null
  /** Trailing mean over the window, null until enough logged days exist. */
  average: number | null
}

/**
 * Daily energy with a trailing average over it.
 *
 * The average is what the eye should follow: day to day swings are groceries
 * and appetite, not a change in how somebody eats. The same reasoning already
 * governs weight (docs/hedeflerim.md § 4.7 smooths it before reading a trend).
 *
 * Empty days are skipped on both lines rather than counted as zero, and the
 * average only appears once `windowSize` logged days have accumulated, so the
 * first points do not present a one day mean as a trend.
 */
export function energyTrend(days: NutritionDay[], windowSize = 7): TrendPoint[] {
  const recent: number[] = []
  return days.map((day) => {
    const logged = isLoggedDay(day)
    if (logged) {
      recent.push(day.kcal)
      if (recent.length > windowSize) recent.shift()
    }
    return {
      date: day.date,
      value: logged ? day.kcal : null,
      average: recent.length === windowSize ? mean(recent) : null,
    }
  })
}

/**
 * Rounds to something honest to say out loud.
 *
 * A daily energy figure built from portion estimates is accurate to a couple
 * of hundred kilocalories at best, so it is shown to the nearest ten and never
 * with a decimal (docs/hedeflerim.md § 4.6: rounding happens in ranges, never
 * in decimals).
 */
export function roundEnergy(kcal: number): number {
  return Math.round(kcal / 10) * 10
}
