import { describe, expect, it } from 'vitest'
import {
  ADULT_AGE_YEARS,
  BETA_ENERGY_PRIORITY,
  CALORIE_FLOOR_KCAL,
  DEFAULT_GOAL_DIRECTION,
  DEFAULT_WEEKLY_CHANGE_RATIO,
  FAT_FLOOR_PER_KG,
  GOAL_DIRECTIONS,
  GOAL_ESTIMATE_NOTE,
  GOAL_KIDNEY_NOTE,
  GOAL_MOVEMENT_NOTE,
  GOAL_NO_DEFICIT_NOTE,
  GOAL_PROFESSIONAL_SUPPORT_NOTE,
  GOAL_RAPID_CHANGE_NOTE,
  HAND_TERMS,
  KCAL_PER_KG_BODY_MASS,
  MAX_WEEKLY_CHANGE_RATIO,
  MIN_VEGETABLE_FISTS,
  MINOR_NOTE,
  PAL_RANGES,
  UNKNOWN_ACTIVITY_PAL_RANGE,
  WEIGHT_BASED_PROTEIN_PER_KG,
  basalEnergy,
  bmr,
  bodyComposition,
  calculateGoals,
  deficitRate,
  directionEnergyAdjustment,
  fatGrams,
  formatHandCount,
  goalDirectionMeta,
  goalRangeMid,
  handCountRange,
  handMeasures,
  isRapidChangePattern,
  katchMcArdleBmr,
  macroSplit,
  maintenanceEnergy,
  minKcalForNonNegativeCarb,
  resolveCalorieTarget,
  targetWeightRange,
  type GoalDirection,
  type GoalsInput,
  type GoalsResult,
} from '@afiet/core'

/** Adult male with measurements: the engine runs its most informed path. */
const measuredAdult: GoalsInput = {
  sex: 'erkek',
  ageYears: 30,
  heightCm: 175,
  weightKg: 70,
  activityLevel: 'orta',
  measurements: { waistCm: 90, neckCm: 40 },
  direction: 'hafifle',
}

/** Same person without a tape measure: no fat free mass, lower confidence. */
const unmeasuredAdult: GoalsInput = {
  sex: 'erkek',
  ageYears: 30,
  heightCm: 175,
  weightKg: 70,
  activityLevel: 'orta',
  direction: 'hafifle',
}

function targeted(result: GoalsResult) {
  expect(result.target).not.toBeNull()
  expect(result.macros).not.toBeNull()
  expect(result.hand).not.toBeNull()
  return {
    target: result.target!,
    macros: result.macros!,
    hand: result.hand!,
    maintenance: result.maintenance!,
  }
}

describe('goal directions (doc section 3)', () => {
  it('carries the five keys with the documented energy adjustments', () => {
    expect(GOAL_DIRECTIONS.map((d) => d.key)).toEqual([
      'hafifle',
      'donusum',
      'koru',
      'guclen',
      'duzen',
    ])
    expect(directionEnergyAdjustment('hafifle')).toBeCloseTo(-0.11, 10)
    expect(directionEnergyAdjustment('donusum')).toBeCloseTo(-0.03, 10)
    expect(directionEnergyAdjustment('koru')).toBe(0)
    expect(directionEnergyAdjustment('guclen')).toBeCloseTo(0.08, 10)
    expect(directionEnergyAdjustment('duzen')).toBe(0)
  })

  it('carries the documented protein bands per direction', () => {
    expect(goalDirectionMeta('hafifle').proteinPerKgFfm).toEqual({ min: 1.8, max: 2.2 })
    expect(goalDirectionMeta('donusum').proteinPerKgFfm).toEqual({ min: 2.0, max: 2.4 })
    expect(goalDirectionMeta('koru').proteinPerKgFfm).toEqual({ min: 1.4, max: 1.8 })
    expect(goalDirectionMeta('guclen').proteinPerKgFfm).toEqual({ min: 1.8, max: 2.2 })
    expect(goalDirectionMeta('duzen').proteinPerKgFfm).toEqual({ min: 1.4, max: 1.6 })
  })

  it('defaults to duzen and mutes numbers until a direction is chosen', () => {
    expect(DEFAULT_GOAL_DIRECTION).toBe('duzen')

    const silent = calculateGoals({ ...measuredAdult, direction: undefined })
    expect(silent.direction).toBe('duzen')
    expect(silent.directionChosen).toBe(false)
    expect(silent.numericTargetsMuted).toBe(true)
    // The screen still looks full on day one (doc section 8).
    expect(silent.hand).not.toBeNull()

    const chosen = calculateGoals({ ...measuredAdult, direction: 'duzen' })
    expect(chosen.directionChosen).toBe(true)
    expect(chosen.numericTargetsMuted).toBe(false)
  })

  it('derives the deficit rate from the energy priority and clamps E', () => {
    expect(BETA_ENERGY_PRIORITY).toBe(0.5)
    expect(deficitRate(0)).toBeCloseTo(0.15, 10)
    expect(deficitRate(0.5)).toBeCloseTo(0.11, 10)
    expect(deficitRate(1)).toBeCloseTo(0.07, 10)
    expect(deficitRate(-5)).toBeCloseTo(0.15, 10)
    expect(deficitRate(5)).toBeCloseTo(0.07, 10)
    expect(deficitRate(Number.NaN)).toBeCloseTo(0.11, 10)
    expect(directionEnergyAdjustment('hafifle', 1)).toBeCloseTo(-0.07, 10)
    // A fixed direction ignores E; only the deficit-rate direction reacts.
    expect(directionEnergyAdjustment('donusum', 1)).toBeCloseTo(-0.03, 10)
  })
})

describe('composition (doc section 4.1)', () => {
  it('derives fat free mass as weight times one minus body fat', () => {
    const composition = bodyComposition({
      sex: 'erkek',
      heightCm: 175,
      weightKg: 70,
      measurements: { waistCm: 90, neckCm: 40 },
    })
    expect(composition.bodyFatFraction).not.toBeNull()
    expect(composition.bodyFatFraction!).toBeGreaterThan(0.1)
    expect(composition.bodyFatFraction!).toBeLessThan(0.3)
    expect(composition.ffmKg!).toBeCloseTo(70 * (1 - composition.bodyFatFraction!), 10)
  })

  it('returns no fat free mass when measurements are missing or impossible', () => {
    const none = bodyComposition({ sex: 'erkek', heightCm: 175, weightKg: 70 })
    expect(none).toEqual({ bodyFatFraction: null, ffmKg: null })

    const partial = bodyComposition({
      sex: 'kadin',
      heightCm: 165,
      weightKg: 60,
      measurements: { waistCm: 75, neckCm: 34 },
    })
    expect(partial.ffmKg).toBeNull()

    const impossible = bodyComposition({
      sex: 'erkek',
      heightCm: 175,
      weightKg: 70,
      measurements: { waistCm: 40, neckCm: 40 },
    })
    expect(impossible.ffmKg).toBeNull()

    const implausible = bodyComposition({
      sex: 'kadin',
      heightCm: 150,
      weightKg: 90,
      measurements: { waistCm: 200, neckCm: 30, hipCm: 200 },
    })
    expect(implausible.ffmKg).toBeNull()
  })

  it('keeps running at lower confidence when the tape measure is missing', () => {
    const measured = calculateGoals(measuredAdult)
    const unmeasured = calculateGoals(unmeasuredAdult)

    expect(measured.confidence).toBe('medium')
    expect(unmeasured.confidence).toBe('low')
    expect(unmeasured.composition.ffmKg).toBeNull()
    expect(targeted(unmeasured).target.mid).toBeGreaterThan(0)
    expect(unmeasured.confidenceNote).toBe(GOAL_ESTIMATE_NOTE)
  })
})

describe('basal energy (doc section 4.2)', () => {
  it('uses Katch-McArdle when fat free mass is known', () => {
    const basal = basalEnergy({
      sex: 'erkek',
      weightKg: 70,
      heightCm: 175,
      ageYears: 30,
      ffmKg: 56,
    })
    expect(basal.source).toBe('katch')
    expect(basal.kcal).toBeCloseTo(370 + 21.6 * 56, 10)
    expect(katchMcArdleBmr(56)).toBeCloseTo(1579.6, 10)
  })

  it('falls back to the existing Mifflin implementation without fat free mass', () => {
    const basal = basalEnergy({
      sex: 'kadin',
      weightKg: 60,
      heightCm: 165,
      ageYears: 40,
      ffmKg: null,
    })
    expect(basal.source).toBe('mifflin')
    expect(basal.kcal).toBe(bmr('kadin', 60, 165, 40))
  })

  it('ignores sex and age once fat free mass is known', () => {
    const woman = calculateGoals({
      ...measuredAdult,
      sex: 'kadin',
      measurements: { waistCm: 80, neckCm: 32, hipCm: 100 },
    })
    const composition = woman.composition
    expect(woman.basal!.source).toBe('katch')
    expect(woman.basal!.kcal).toBeCloseTo(370 + 21.6 * composition.ffmKg!, 10)
  })
})

describe('energy (doc section 4.3)', () => {
  it('exposes PAL as a range whose midpoints match the doc table', () => {
    expect(goalRangeMid(PAL_RANGES.hareketsiz)).toBeCloseTo(1.275, 10)
    expect(goalRangeMid(PAL_RANGES.az)).toBeCloseTo(1.425, 10)
    expect(goalRangeMid(PAL_RANGES.orta)).toBeCloseTo(1.575, 10)
    expect(goalRangeMid(PAL_RANGES.aktif)).toBeCloseTo(1.725, 10)
    expect(goalRangeMid(PAL_RANGES.cok_aktif)).toBeCloseTo(1.875, 10)
    expect(PAL_RANGES.hareketsiz).toEqual({ min: 1.2, max: 1.35 })
    expect(PAL_RANGES.cok_aktif).toEqual({ min: 1.8, max: 1.95 })
  })

  it('spans the widest honest PAL band when the activity level is unknown', () => {
    const energy = maintenanceEnergy({ basalKcal: 1600 })
    expect(energy.source).toBe('activity')
    expect(energy.range.min).toBeCloseTo(1600 * UNKNOWN_ACTIVITY_PAL_RANGE.min, 10)
    expect(energy.range.max).toBeCloseTo(1600 * UNKNOWN_ACTIVITY_PAL_RANGE.max, 10)
    expect(calculateGoals({ ...measuredAdult, activityLevel: undefined }).confidence).toBe('low')
  })

  it('bypasses the activity multiplier entirely when movement data is present', () => {
    const still = maintenanceEnergy({
      basalKcal: 1600,
      activityLevel: 'hareketsiz',
      movement: { activeKcalPerDay: 500 },
    })
    const busy = maintenanceEnergy({
      basalKcal: 1600,
      activityLevel: 'cok_aktif',
      movement: { activeKcalPerDay: 500 },
    })
    expect(still.source).toBe('movement')
    expect(still.range).toEqual(busy.range)

    const point = 1600 + 500 + 1600 * 0.1
    expect(goalRangeMid(still.range)).toBeCloseTo(point, 6)
    expect(still.range.min).toBeLessThan(point)
    expect(still.range.max).toBeGreaterThan(point)

    const engineStill = calculateGoals({
      ...measuredAdult,
      activityLevel: 'hareketsiz',
      movement: { activeKcalPerDay: 500 },
    })
    const engineBusy = calculateGoals({
      ...measuredAdult,
      activityLevel: 'cok_aktif',
      movement: { activeKcalPerDay: 500 },
    })
    expect(engineStill.target!.mid).toBeCloseTo(engineBusy.target!.mid, 10)
    expect(engineStill.confidence).toBe('high')
    expect(engineStill.confidenceNote).toBe(GOAL_MOVEMENT_NOTE)
  })

  it('treats negative active energy as zero', () => {
    const energy = maintenanceEnergy({ basalKcal: 1600, movement: { activeKcalPerDay: -900 } })
    expect(goalRangeMid(energy.range)).toBeCloseTo(1600 * 1.1, 6)
  })
})

describe('calorie target gates (doc sections 4.4 and 9)', () => {
  const base = {
    sex: 'erkek' as const,
    weightKg: 80,
    maintenanceKcal: 2600,
    proteinG: 150,
  }

  it('applies the direction adjustment when nothing binds', () => {
    const resolution = resolveCalorieTarget({ ...base, requestedAdjustment: -0.11 })
    expect(resolution.rails).toEqual([])
    expect(resolution.kcal).toBeCloseTo(2600 * 0.89, 6)
    expect(resolution.appliedAdjustment).toBeCloseTo(-0.11, 6)
  })

  it('shrinks the deficit instead of raising the weekly cap', () => {
    const resolution = resolveCalorieTarget({ ...base, requestedAdjustment: -0.4 })
    expect(resolution.rails).toContain('weekly_change_cap')
    expect(resolution.weeklyChangeCapKg).toBeCloseTo(80 * DEFAULT_WEEKLY_CHANGE_RATIO, 10)
    expect(Math.abs(resolution.impliedWeeklyChangeKg)).toBeCloseTo(
      resolution.weeklyChangeCapKg,
      6,
    )
    expect(resolution.appliedAdjustment).toBeGreaterThan(-0.4)
    expect(resolution.kcal).toBeCloseTo(
      2600 - (80 * DEFAULT_WEEKLY_CHANGE_RATIO * KCAL_PER_KG_BODY_MASS) / 7,
      6,
    )
  })

  it('caps a surplus direction with the same weekly ceiling', () => {
    const resolution = resolveCalorieTarget({
      ...base,
      requestedAdjustment: 0.4,
      weeklyChangeCapRatio: 0.005,
    })
    expect(resolution.rails).toContain('weekly_change_cap')
    expect(resolution.impliedWeeklyChangeKg).toBeCloseTo(80 * 0.005, 6)
  })

  it('never lets a caller push the weekly cap past one percent', () => {
    const resolution = resolveCalorieTarget({
      ...base,
      requestedAdjustment: -0.4,
      weeklyChangeCapRatio: 0.05,
    })
    expect(resolution.weeklyChangeCapKg).toBeCloseTo(80 * MAX_WEEKLY_CHANGE_RATIO, 10)
    expect(Math.abs(resolution.impliedWeeklyChangeKg)).toBeLessThanOrEqual(
      80 * MAX_WEEKLY_CHANGE_RATIO + 1e-6,
    )
  })

  it('never produces a target under the sex floor', () => {
    expect(CALORIE_FLOOR_KCAL).toEqual({ kadin: 1200, erkek: 1500 })

    const woman = resolveCalorieTarget({
      sex: 'kadin',
      weightKg: 45,
      maintenanceKcal: 1300,
      requestedAdjustment: -0.11,
      proteinG: 60,
    })
    expect(woman.rails).toContain('calorie_floor')
    expect(woman.kcal).toBeCloseTo(1200, 6)

    const man = resolveCalorieTarget({
      sex: 'erkek',
      weightKg: 55,
      maintenanceKcal: 1600,
      requestedAdjustment: -0.15,
      proteinG: 80,
    })
    expect(man.rails).toContain('calorie_floor')
    expect(man.kcal).toBeCloseTo(1500, 6)
  })

  it('clamps to the floor even when maintenance itself sits below it', () => {
    const resolution = resolveCalorieTarget({
      sex: 'kadin',
      weightKg: 38,
      maintenanceKcal: 1100,
      requestedAdjustment: -0.11,
      proteinG: 50,
    })
    expect(resolution.rails).toContain('calorie_floor')
    expect(resolution.kcal).toBe(1200)
    expect(resolution.appliedAdjustment).toBeGreaterThan(0)
  })

  it('removes the deficit when a declaration forbids it', () => {
    const resolution = resolveCalorieTarget({
      ...base,
      requestedAdjustment: -0.11,
      deficitForbidden: true,
    })
    expect(resolution.rails).toContain('no_deficit_declaration')
    expect(resolution.kcal).toBe(2600)
    expect(resolution.appliedAdjustment).toBe(0)
  })

  it('leaves a surplus untouched when only deficits are forbidden', () => {
    const resolution = resolveCalorieTarget({
      ...base,
      requestedAdjustment: 0.08,
      deficitForbidden: true,
    })
    expect(resolution.rails).not.toContain('no_deficit_declaration')
    expect(resolution.appliedAdjustment).toBeCloseTo(0.08, 6)
  })
})

describe('macro order (doc section 4.5)', () => {
  it('places the fat floor above the hormone health minimum', () => {
    expect(fatGrams(1000, 80)).toBeCloseTo(FAT_FLOOR_PER_KG * 80, 10)
    expect(fatGrams(3600, 80)).toBeCloseTo((3600 * 0.25) / 9, 10)
    expect(fatGrams(0, 80)).toBeCloseTo(48, 10)
  })

  it('treats carbohydrate as the remainder and reports it even when negative', () => {
    const split = macroSplit(2200, 140, 70)
    expect(split.protein).toBe(140)
    expect(split.fat).toBeCloseTo(fatGrams(2200, 70), 10)
    expect(split.carb).toBeCloseTo((2200 - 140 * 4 - split.fat * 9) / 4, 10)
    expect(split.protein * 4 + split.fat * 9 + split.carb * 4).toBeCloseTo(2200, 6)

    const impossible = macroSplit(900, 250, 100)
    expect(impossible.carb).toBeLessThan(0)
    // The fat floor holds even while the remainder is negative.
    expect(impossible.fat).toBeCloseTo(FAT_FLOOR_PER_KG * 100, 10)
  })

  it('solves the smallest target that keeps the remainder non negative', () => {
    // Fat floor branch: protein plus the floor still sits under the 25% share.
    expect(minKcalForNonNegativeCarb(60, 70)).toBeCloseTo(60 * 4 + 0.6 * 70 * 9, 10)
    // Share branch: protein dominates, so the 25% share takes over.
    expect(minKcalForNonNegativeCarb(350, 55)).toBeCloseTo((350 * 4) / 0.75, 10)

    for (const [protein, weight] of [
      [60, 70],
      [350, 55],
      [120, 90],
      [200, 60],
    ]) {
      const required = minKcalForNonNegativeCarb(protein, weight)
      expect(macroSplit(required, protein, weight).carb).toBeCloseTo(0, 6)
      expect(macroSplit(required * 1.01, protein, weight).carb).toBeGreaterThan(0)
    }
  })

  it('shrinks the deficit when the remainder would go negative', () => {
    const resolution = resolveCalorieTarget({
      sex: 'erkek',
      weightKg: 55,
      maintenanceKcal: 2200,
      requestedAdjustment: -0.3,
      proteinG: 350,
      weeklyChangeCapRatio: MAX_WEEKLY_CHANGE_RATIO,
    })
    expect(resolution.rails).toContain('weekly_change_cap')
    expect(resolution.rails).toContain('carbohydrate_floor')
    expect(resolution.kcal).toBeCloseTo(minKcalForNonNegativeCarb(350, 55), 6)
    expect(macroSplit(resolution.kcal, 350, 55).carb).toBeCloseTo(0, 6)
    expect(macroSplit(resolution.kcal, 350, 55).fat).toBeGreaterThanOrEqual(
      FAT_FLOOR_PER_KG * 55,
    )
  })

  it('shrinks the deficit at most to maintenance, never breaching the fat floor', () => {
    const resolution = resolveCalorieTarget({
      sex: 'erkek',
      weightKg: 55,
      maintenanceKcal: 1800,
      requestedAdjustment: -0.11,
      proteinG: 350,
    })
    expect(resolution.rails).toContain('carbohydrate_floor')
    expect(resolution.kcal).toBe(1800)
    expect(resolution.appliedAdjustment).toBe(0)
    expect(macroSplit(1800, 350, 55).fat).toBeGreaterThanOrEqual(FAT_FLOOR_PER_KG * 55)
  })

  it('scales protein from fat free mass and drops the coefficients without it', () => {
    const measured = calculateGoals(measuredAdult)
    const unmeasured = calculateGoals(unmeasuredAdult)
    const ffm = measured.composition.ffmKg!

    expect(measured.macros!.proteinBase).toBe('ffm')
    expect(measured.macros!.proteinPerKg).toEqual({ min: 1.8, max: 2.2 })
    expect(measured.macros!.protein.min).toBeCloseTo(1.8 * ffm, 6)
    expect(measured.macros!.protein.max).toBeCloseTo(2.2 * ffm, 6)

    expect(unmeasured.macros!.proteinBase).toBe('weight')
    expect(unmeasured.macros!.proteinPerKg).toEqual(WEIGHT_BASED_PROTEIN_PER_KG)
    expect(unmeasured.macros!.protein.min).toBeCloseTo(1.2 * 70, 6)
    expect(unmeasured.macros!.protein.max).toBeCloseTo(1.6 * 70, 6)
  })

  it('keeps protein independent of the calorie target', () => {
    const still = calculateGoals({ ...measuredAdult, activityLevel: 'hareketsiz' })
    const busy = calculateGoals({ ...measuredAdult, activityLevel: 'cok_aktif' })
    expect(still.macros!.protein).toEqual(busy.macros!.protein)
    expect(busy.target!.mid).toBeGreaterThan(still.target!.mid)
    expect(busy.macros!.carb.min).toBeGreaterThan(still.macros!.carb.min)
  })
})

describe('hand measures (doc section 4.6)', () => {
  it('rounds by range and never by decimals', () => {
    expect(handCountRange(3.4)).toEqual({ min: 3, max: 4 })
    expect(formatHandCount(handCountRange(3.4))).toBe('3-4')
    expect(formatHandCount(handCountRange(3.5))).toBe('3-4')
    expect(formatHandCount(handCountRange(3.6))).toBe('3-4')
    expect(formatHandCount(handCountRange(3.05))).toBe('3')
    expect(formatHandCount(handCountRange(2.9))).toBe('3')
    expect(formatHandCount(handCountRange(4))).toBe('4')
    // Small and degenerate values still read as at least one hand.
    expect(formatHandCount(handCountRange(0.4))).toBe('1')
    expect(formatHandCount(handCountRange(0))).toBe('1')
    expect(formatHandCount(handCountRange(Number.NaN))).toBe('1')
  })

  it('uses the blog vocabulary without drifting', () => {
    expect(HAND_TERMS).toEqual({
      protein: 'avuç içi',
      vegetable: 'yumruk',
      grain: 'kapalı avuç',
      fat: 'başparmak',
    })
    const measures = handMeasures({
      sex: 'kadin',
      proteinG: 110,
      carbG: 200,
      fatG: 60,
      fiberG: 28,
    })
    expect(measures.map((m) => m.key)).toEqual(['protein', 'vegetable', 'grain', 'fat'])
    for (const measure of measures) {
      expect(measure.text).toMatch(/^\d+(-\d+)? \S/)
      expect(measure.text).not.toMatch(/[.,]/)
      expect(measure.text).not.toContain('çukur avuç')
      expect(measure.text.endsWith(measure.term)).toBe(true)
      expect(Number.isInteger(measure.count.min)).toBe(true)
      expect(Number.isInteger(measure.count.max)).toBe(true)
    }
  })

  it('converts with the per sex coefficients', () => {
    const shared = { proteinG: 112, carbG: 250, fatG: 60, fiberG: 28 }
    const woman = handMeasures({ sex: 'kadin', ...shared })
    const man = handMeasures({ sex: 'erkek', ...shared })
    // 112 g of protein is 112/22 palms for a woman and 112/28 for a man.
    expect(formatHandCount(woman[0].count)).toBe('5')
    expect(formatHandCount(man[0].count)).toBe('4')
    /* Grain and fat read the portion share, not the whole macro: 250 g of
       carbohydrate is 250 x 0.55 / 25 cupped hands for a woman, because fruit,
       dairy and vegetables are not served by the cupped hand. */
    expect(formatHandCount(woman[2].count)).toBe('5-6')
    expect(formatHandCount(man[2].count)).toBe('4-5')
    expect(formatHandCount(woman[3].count)).toBe('2-3')
    expect(formatHandCount(man[3].count)).toBe('2-3')
  })

  it('keeps the whole macro out of the hand reading', () => {
    /* The regression this guards: dividing the entire carbohydrate and fat
       target by the per-portion figure produced readings like "13-14 kapalı
       avuç" for an ordinary day, which is an instruction nobody can follow. */
    const measures = handMeasures({
      sex: 'erkek',
      proteinG: 112,
      carbG: 406,
      fatG: 77,
      fiberG: 34,
    })
    const grain = measures.find((measure) => measure.key === 'grain')
    const fat = measures.find((measure) => measure.key === 'fat')

    expect(grain?.count.max).toBeLessThanOrEqual(9)
    expect(fat?.count.max).toBeLessThanOrEqual(4)
  })

  it('derives vegetable fists from fiber with a floor of three', () => {
    const low = handMeasures({ sex: 'kadin', proteinG: 90, carbG: 150, fatG: 45, fiberG: 14 })
    expect(low[1].count).toEqual({ min: MIN_VEGETABLE_FISTS, max: MIN_VEGETABLE_FISTS })

    const high = handMeasures({ sex: 'erkek', proteinG: 140, carbG: 320, fatG: 80, fiberG: 45 })
    expect(high[1].count.min).toBeGreaterThanOrEqual(MIN_VEGETABLE_FISTS)
    expect(high[1].count.min).toBeGreaterThan(low[1].count.min)
  })
})

describe('safety rails (doc section 9)', () => {
  it('withholds every target under eighteen and speaks balance language', () => {
    expect(ADULT_AGE_YEARS).toBe(18)
    const minor = calculateGoals({ ...measuredAdult, ageYears: 15 })
    expect(minor.rails).toContain('minor')
    expect(minor.targetsWithheld).toBe(true)
    expect(minor.target).toBeNull()
    expect(minor.macros).toBeNull()
    expect(minor.hand).toBeNull()
    expect(minor.notes).toContain(MINOR_NOTE)
    // Composition and expenditure stay as information, never as a target.
    expect(minor.basal).not.toBeNull()
    expect(minor.maintenance).not.toBeNull()

    const adult = calculateGoals({ ...measuredAdult, ageYears: 18 })
    expect(adult.rails).not.toContain('minor')
    expect(adult.target).not.toBeNull()
  })

  it('refuses a deficit under a pregnancy or breastfeeding declaration', () => {
    for (const declaration of [{ pregnant: true }, { breastfeeding: true }]) {
      const result = calculateGoals({
        ...measuredAdult,
        sex: 'kadin',
        measurements: { waistCm: 80, neckCm: 32, hipCm: 100 },
        direction: 'hafifle',
        declarations: declaration,
      })
      expect(result.rails).toContain('no_deficit_declaration')
      expect(result.target!.requestedAdjustment).toBeLessThan(0)
      expect(result.target!.appliedAdjustment).toBeGreaterThanOrEqual(0)
      expect(result.notes).toContain(GOAL_NO_DEFICIT_NOTE)
      expect(result.professionalSupportSuggested).toBe(true)
      expect(result.notes).toContain(GOAL_PROFESSIONAL_SUPPORT_NOTE)
    }
  })

  it('caps protein under a declared kidney condition', () => {
    const result = calculateGoals({ ...measuredAdult, declarations: { kidneyCondition: true } })
    expect(result.rails).toContain('kidney_protein_cap')
    expect(result.macros!.proteinBase).toBe('weight')
    expect(result.macros!.proteinPerKg.max).toBeLessThanOrEqual(0.8)
    expect(result.macros!.protein.max).toBeCloseTo(0.8 * 70, 6)
    expect(result.notes).toContain(GOAL_KIDNEY_NOTE)
    expect(result.professionalSupportSuggested).toBe(true)

    const unrestricted = calculateGoals(measuredAdult)
    expect(result.macros!.protein.max).toBeLessThan(unrestricted.macros!.protein.max)
  })

  it('keeps every produced target above the sex floor', () => {
    const smallWoman = calculateGoals({
      sex: 'kadin',
      ageYears: 65,
      heightCm: 150,
      weightKg: 42,
      activityLevel: 'hareketsiz',
      direction: 'hafifle',
    })
    const { target } = targeted(smallWoman)
    expect(target.range.min).toBeGreaterThanOrEqual(CALORIE_FLOOR_KCAL.kadin)
    expect(target.mid).toBeGreaterThanOrEqual(CALORIE_FLOOR_KCAL.kadin)
    expect(smallWoman.rails).toContain('calorie_floor')

    const smallMan = calculateGoals({
      sex: 'erkek',
      ageYears: 70,
      heightCm: 160,
      weightKg: 50,
      activityLevel: 'hareketsiz',
      direction: 'hafifle',
    })
    expect(smallMan.target!.range.min).toBeGreaterThanOrEqual(CALORIE_FLOOR_KCAL.erkek)
  })

  it('needs all three signals before it pulls a target back', () => {
    const args = { weightKg: 60, targetKcal: 1250, floorKcal: 1200 }
    expect(isRapidChangePattern({ ...args, pattern: undefined })).toBe(false)
    expect(
      isRapidChangePattern({ ...args, pattern: { weeklyChangeKg: -0.9, weighInDaysPerWeek: 6 } }),
    ).toBe(true)
    // Rapid loss alone, or frequent weighing alone, is normal behaviour.
    expect(
      isRapidChangePattern({ ...args, pattern: { weeklyChangeKg: -0.9, weighInDaysPerWeek: 1 } }),
    ).toBe(false)
    expect(
      isRapidChangePattern({ ...args, pattern: { weeklyChangeKg: -0.2, weighInDaysPerWeek: 6 } }),
    ).toBe(false)
    // A comfortable target is not a very low one.
    expect(
      isRapidChangePattern({
        ...args,
        targetKcal: 2100,
        pattern: { weeklyChangeKg: -0.9, weighInDaysPerWeek: 6 },
      }),
    ).toBe(false)
    expect(
      isRapidChangePattern({ ...args, pattern: { weeklyChangeKg: -0.9 } }),
    ).toBe(false)
  })

  it('pulls the target back to balance on the rapid change pattern', () => {
    const atRisk: GoalsInput = {
      sex: 'kadin',
      ageYears: 60,
      heightCm: 155,
      weightKg: 45,
      activityLevel: 'hareketsiz',
      direction: 'hafifle',
      recentPattern: { weeklyChangeKg: -0.6, weighInDaysPerWeek: 6 },
    }
    const pulled = calculateGoals(atRisk)
    const relaxed = calculateGoals({ ...atRisk, recentPattern: { weeklyChangeKg: -0.6 } })

    expect(pulled.rails).toContain('rapid_change_pattern')
    expect(pulled.rails).toContain('no_deficit_declaration')
    expect(pulled.target!.appliedAdjustment).toBeGreaterThanOrEqual(0)
    expect(pulled.target!.mid).toBeGreaterThan(relaxed.target!.mid)
    expect(pulled.notes).toContain(GOAL_RAPID_CHANGE_NOTE)
    expect(pulled.professionalSupportSuggested).toBe(true)
  })

  it('leaves a healthy adult with no rails at all', () => {
    const result = calculateGoals(measuredAdult)
    expect(result.rails).toEqual([])
    expect(result.professionalSupportSuggested).toBe(false)
    expect(result.notes).toEqual([])
  })
})

describe('engine output shape (doc sections 2, 11 and 12)', () => {
  it('returns ranges rather than single numbers', () => {
    const result = calculateGoals(measuredAdult)
    const { target, macros, maintenance } = targeted(result)

    for (const range of [
      maintenance.range,
      target.range,
      macros.protein,
      macros.fat,
      macros.carb,
      macros.fiber,
    ]) {
      expect(range.max).toBeGreaterThanOrEqual(range.min)
      expect(Number.isFinite(range.min)).toBe(true)
      expect(Number.isFinite(range.max)).toBe(true)
    }
    expect(target.range.max).toBeGreaterThan(target.range.min)
    expect(target.mid).toBeGreaterThan(target.range.min)
    expect(target.mid).toBeLessThan(target.range.max)
    expect(target.mid).toBeCloseTo(goalRangeMid(maintenance.range) * (1 - 0.11), 6)
  })

  it('never returns a target weight or a duration', () => {
    const result = calculateGoals(measuredAdult) as unknown as Record<string, unknown>
    const keys = Object.keys(result).concat(Object.keys(result.target as object))
    for (const key of keys) {
      expect(key.toLowerCase()).not.toContain('weight')
      expect(key.toLowerCase()).not.toContain('week')
      expect(key.toLowerCase()).not.toContain('duration')
    }
  })

  it('uses the corrected target weight formula for the intermediate value', () => {
    const range = targetWeightRange({ min: 66, max: 70 }, { min: 0.15, max: 0.18 })
    expect(range.min).toBeCloseTo(77.6, 1)
    expect(range.max).toBeCloseTo(85.4, 1)
    // The inverted formula of the external document would narrow it the wrong way.
    expect(range.min).toBeLessThan(80.5)
    expect(range.max).toBeGreaterThan(82.4)
  })

  it('still computes without an activity level, only less confidently', () => {
    /* Activity level is reported as missing so the acquaintance meter can
       invite it, but unlike sex, age, height and weight it does not stop the
       calculation: the maintenance range just widens. Treating it as a blocker
       would blank the screen for anyone who skipped that one setup question. */
    const withoutActivity = calculateGoals({
      sex: 'kadin',
      ageYears: 34,
      heightCm: 168,
      weightKg: 68,
    })

    expect(withoutActivity.missingInputs).toContain('activityLevel')
    expect(withoutActivity.targetsWithheld).toBe(false)
    expect(withoutActivity.target).not.toBeNull()
    expect(withoutActivity.hand).not.toBeNull()
    expect(withoutActivity.basal).not.toBeNull()
    expect(withoutActivity.confidence).toBe('low')
  })

  it('reports what it still needs instead of guessing', () => {
    const nothing = calculateGoals({})
    expect(nothing.missingInputs.sort()).toEqual([
      'activityLevel',
      'age',
      'heightCm',
      'sex',
      'weightKg',
    ])
    expect(nothing.targetsWithheld).toBe(true)
    expect(nothing.target).toBeNull()
    expect(nothing.macros).toBeNull()
    expect(nothing.hand).toBeNull()
    expect(nothing.confidence).toBe('low')
    expect(nothing.direction).toBe(DEFAULT_GOAL_DIRECTION)

    const noWeight = calculateGoals({ ...measuredAdult, weightKg: undefined })
    expect(noWeight.missingInputs).toEqual(['weightKg'])
    expect(noWeight.target).toBeNull()

    const zeroWeight = calculateGoals({ ...measuredAdult, weightKg: 0 })
    expect(zeroWeight.missingInputs).toEqual(['weightKg'])
  })

  it('accepts a birth date with an explicit reference day', () => {
    const before = calculateGoals({
      ...measuredAdult,
      ageYears: undefined,
      birthDate: '2008-07-20',
      today: new Date(2026, 6, 19),
    })
    const after = calculateGoals({
      ...measuredAdult,
      ageYears: undefined,
      birthDate: '2008-07-20',
      today: new Date(2026, 6, 20),
    })
    expect(before.rails).toContain('minor')
    expect(after.rails).not.toContain('minor')
  })

  it('keeps user-facing strings free of em dashes and coach framing', () => {
    const notes = [
      GOAL_ESTIMATE_NOTE,
      GOAL_MOVEMENT_NOTE,
      GOAL_NO_DEFICIT_NOTE,
      GOAL_KIDNEY_NOTE,
      GOAL_RAPID_CHANGE_NOTE,
      GOAL_PROFESSIONAL_SUPPORT_NOTE,
    ]
    const emDash = String.fromCharCode(0x2014)
    for (const note of notes) {
      expect(note).not.toContain(emDash)
      expect(note.toLowerCase()).not.toContain('kalori')
      expect(note.toLowerCase()).not.toContain('kilo')
      expect(note.toLowerCase()).not.toContain('hedefini')
    }
    expect(GOAL_ESTIMATE_NOTE).toContain('tahmin')
  })
})

describe('extreme inputs', () => {
  const directions: GoalDirection[] = ['hafifle', 'donusum', 'koru', 'guclen', 'duzen']
  const bodies: GoalsInput[] = [
    { sex: 'kadin', ageYears: 18, heightCm: 140, weightKg: 35, activityLevel: 'hareketsiz' },
    { sex: 'erkek', ageYears: 90, heightCm: 200, weightKg: 300, activityLevel: 'cok_aktif' },
    {
      sex: 'erkek',
      ageYears: 25,
      heightCm: 185,
      weightKg: 130,
      activityLevel: 'az',
      measurements: { waistCm: 130, neckCm: 45 },
    },
    {
      sex: 'kadin',
      ageYears: 30,
      heightCm: 160,
      weightKg: 50,
      activityLevel: 'aktif',
      measurements: { waistCm: 65, neckCm: 30, hipCm: 90 },
    },
  ]

  it('keeps every output finite, ordered and inside its rails', () => {
    for (const body of bodies) {
      for (const direction of directions) {
        const result = calculateGoals({ ...body, direction })
        const { target, macros, hand } = targeted(result)
        const floor = CALORIE_FLOOR_KCAL[body.sex!]

        expect(target.range.min).toBeGreaterThanOrEqual(floor - 1e-6)
        expect(target.range.min).toBeLessThanOrEqual(target.range.max)
        expect(macros.carb.min).toBeGreaterThanOrEqual(0)
        expect(macros.fat.min).toBeGreaterThanOrEqual(FAT_FLOOR_PER_KG * body.weightKg! - 1e-6)
        expect(macros.protein.min).toBeGreaterThan(0)

        const energyOfMacros =
          macros.protein.min * 4 + macros.fat.min * 9 + macros.carb.min * 4
        expect(energyOfMacros).toBeLessThanOrEqual(target.range.max + 1e-6)

        for (const measure of hand) {
          expect(measure.count.min).toBeGreaterThanOrEqual(1)
          expect(measure.count.max - measure.count.min).toBeLessThanOrEqual(1)
        }
      }
    }
  })

  it('stays inside the weekly change cap across every body and direction', () => {
    for (const body of bodies) {
      for (const direction of directions) {
        const result = calculateGoals({ ...body, direction })
        const maintenanceMid = goalRangeMid(result.maintenance!.range)
        const dailyDelta = result.target!.mid - maintenanceMid
        const weeklyChangeKg = Math.abs((dailyDelta * 7) / KCAL_PER_KG_BODY_MASS)
        expect(weeklyChangeKg).toBeLessThanOrEqual(
          body.weightKg! * DEFAULT_WEEKLY_CHANGE_RATIO + 1e-6,
        )
        expect(weeklyChangeKg).toBeLessThanOrEqual(body.weightKg! * MAX_WEEKLY_CHANGE_RATIO + 1e-6)
      }
    }
  })

  it('shrinks the deficit when a caller tightens the weekly cap', () => {
    // The beta deficit rate never reaches the 0.75% cap on its own, so the gate
    // is exercised here with a tighter cap the caller may hand in.
    const tight = calculateGoals({ ...measuredAdult, weeklyChangeCapRatio: 0.001 })
    const loose = calculateGoals(measuredAdult)
    expect(tight.rails).toContain('weekly_change_cap')
    expect(loose.rails).not.toContain('weekly_change_cap')
    expect(tight.target!.mid).toBeGreaterThan(loose.target!.mid)

    const maintenanceMid = goalRangeMid(tight.maintenance!.range)
    const weeklyChangeKg = ((maintenanceMid - tight.target!.mid) * 7) / KCAL_PER_KG_BODY_MASS
    expect(weeklyChangeKg).toBeCloseTo(70 * 0.001, 6)
  })
})
