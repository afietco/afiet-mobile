import { describe, expect, it } from 'vitest'
import {
  ageFromBirthDate,
  bmi,
  bmiRange,
  bmr,
  bodyFatPercent,
  fiberGrams,
  macroTargetGrams,
  tdee,
  trendMessage,
  waterGlassesFromTdee,
} from './bodyMetrics'

describe('body metrics', () => {
  it('calculates age around the birthday boundary', () => {
    expect(ageFromBirthDate('1990-07-20', new Date(2026, 6, 19))).toBe(35)
    expect(ageFromBirthDate('1990-07-20', new Date(2026, 6, 20))).toBe(36)
  })

  it('calculates BMI, BMR, and activity-adjusted energy', () => {
    expect(bmi(70, 175)).toBeCloseTo(22.857, 3)
    expect(bmr('erkek', 70, 175, 30)).toBeCloseTo(1648.75, 2)
    expect(bmr('kadin', 70, 175, 30)).toBeCloseTo(1482.75, 2)
    expect(tdee(1648.75, 'orta')).toBeCloseTo(2555.5625, 4)
  })

  it('derives macro, water, and fiber guidance with water limits', () => {
    expect(macroTargetGrams(2000, 'protein')).toBe(125)
    expect(macroTargetGrams(2000, 'carb')).toBe(250)
    expect(macroTargetGrams(2000, 'fat')).toBeCloseTo(66.667, 3)
    expect(waterGlassesFromTdee(800)).toBe(6)
    expect(waterGlassesFromTdee(2200)).toBe(11)
    expect(waterGlassesFromTdee(4000)).toBe(15)
    expect(fiberGrams(2000)).toBe(28)
  })

  it('guards invalid body-fat inputs and calculates valid measurements', () => {
    expect(bodyFatPercent('erkek', 180, 40, 40)).toBeNull()
    expect(bodyFatPercent('kadin', 165, 75, 34)).toBeNull()
    expect(bodyFatPercent('erkek', 180, 90, 40)).toBeGreaterThan(0)
    expect(bodyFatPercent('kadin', 165, 75, 34, 98)).toBeGreaterThan(0)
  })

  it('selects BMI ranges and neutral trend messages at boundaries', () => {
    expect(bmiRange(18.49).key).toBe('ince')
    expect(bmiRange(18.5).key).toBe('denge')
    expect(bmiRange(25).key).toBe('denge_ustu')
    expect(bmiRange(30).key).toBe('yuksek')
    expect(trendMessage(70, 70.04)).toBe('Kilon sabit gidiyor.')
    expect(trendMessage(70, 69, 'range')).toContain('azalma')
  })
})
