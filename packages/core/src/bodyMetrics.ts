import { activityMeta, type ActivityLevel, type Sex } from './types'
import { fromISO } from './dates'

/** Tam yaş (yıl); doğum günü henüz gelmediyse bir eksik */
export function ageFromBirthDate(birthDate: string, today = new Date()): number {
  const b = fromISO(birthDate)
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
  return age
}

/** BMI = kg / m² */
export function bmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100
  return weightKg / (h * h)
}

/** Mifflin-St Jeor bazal metabolizma hızı (kcal/gün) */
export function bmr(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears
  return sex === 'erkek' ? base + 5 : base - 161
}

/** TDEE = BMR × aktivite çarpanı (kcal/gün) */
export function tdee(bmrValue: number, activity: ActivityLevel): number {
  return bmrValue * activityMeta(activity).multiplier
}

/**
 * Dengeli bir gün için yaygın makro enerji aralıkları; katı hedef değil,
 * pusula. EnergySheet'teki makro kartları ve beslenme progress'i buradan okur.
 */
export const MACRO_RANGES = {
  protein: { pctMin: 0.2, pctMax: 0.3, kcalPerG: 4 },
  carb: { pctMin: 0.45, pctMax: 0.55, kcalPerG: 4 },
  fat: { pctMin: 0.25, pctMax: 0.35, kcalPerG: 9 },
} as const

export type MacroKey = keyof typeof MACRO_RANGES

/** Aralığın orta noktasından günlük gram pusulası */
export function macroTargetGrams(tdeeValue: number, key: MacroKey): number {
  const r = MACRO_RANGES[key]
  return (tdeeValue * (r.pctMin + r.pctMax)) / 2 / r.kcalPerG
}

/** Bir su bardağı (ml) */
export const GLASS_ML = 200

/** Günlük su ihtiyacı (ml); yaygın rehber: 1 ml / kcal (TDEE) */
export function waterMl(tdeeValue: number): number {
  return tdeeValue
}

/** Su ihtiyacının bardak karşılığı; 6–15 bardak aralığına yumuşatılır */
export function waterGlassesFromTdee(tdeeValue: number): number {
  return Math.min(15, Math.max(6, Math.round(waterMl(tdeeValue) / GLASS_ML)))
}

/** Günlük lif pusulası (g); yaygın rehber: 14 g / 1000 kcal */
export function fiberGrams(tdeeValue: number): number {
  return (14 * tdeeValue) / 1000
}

/**
 * US Navy vücut yağ oranı (%); metrik log10 formülleri.
 * Kadında kalça gerekir; log domeni dışı girdilerde null.
 */
export function bodyFatPercent(
  sex: Sex,
  heightCm: number,
  waistCm: number,
  neckCm: number,
  hipCm?: number,
): number | null {
  if (sex === 'erkek') {
    if (waistCm - neckCm <= 0) return null
    const d = 1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)
    return 495 / d - 450
  }
  if (hipCm == null) return null
  if (waistCm + hipCm - neckCm <= 0) return null
  const d = 1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.221 * Math.log10(heightCm)
  return 495 / d - 450
}

/**
 * BMI aralıkları; yumuşak, yargılamayan etiketler.
 * `color`: Tailwind renk ailesi anahtarı; sınıflar kullanan bileşende eşlenir.
 */
export interface BmiRange {
  key: 'ince' | 'denge' | 'denge_ustu' | 'yuksek'
  label: string
  /** [min, max) */
  min: number
  max: number
  color: 'sky' | 'emerald' | 'amber' | 'rose'
}

export const BMI_RANGES: BmiRange[] = [
  { key: 'ince', label: 'İnce aralık', min: 0, max: 18.5, color: 'sky' },
  { key: 'denge', label: 'Denge aralığı', min: 18.5, max: 25, color: 'emerald' },
  { key: 'denge_ustu', label: 'Denge üstü', min: 25, max: 30, color: 'amber' },
  { key: 'yuksek', label: 'Yüksek aralık', min: 30, max: 99, color: 'rose' },
]

export function bmiRange(value: number): BmiRange {
  return BMI_RANGES.find((r) => value < r.max) ?? BMI_RANGES[BMI_RANGES.length - 1]
}

const num1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

export function formatNumber(value: number): string {
  return num1.format(value)
}

export function formatKg(value: number): string {
  return `${num1.format(value)} kg`
}

export function formatKcal(value: number): string {
  return `${num0.format(Math.round(value))} kcal`
}

/**
 * Kilo değişimini nötr dille anlatır; kutlama da azar da yok.
 * `scope: 'range'` geçmiş bir ay gezilirken kullanılır; "bu yana" gibi
 * şimdiye gönderme yapan ifade yerine aralık dili kurar.
 */
export function trendMessage(prevKg: number, latestKg: number, scope: 'now' | 'range' = 'now'): string {
  const diff = latestKg - prevKg
  if (Math.abs(diff) < 0.05)
    return scope === 'now' ? 'Kilon sabit gidiyor.' : 'Bu aralıkta kilon sabit seyretmiş.'
  const yon = diff < 0 ? 'azalma' : 'artış'
  return scope === 'now'
    ? `Son ölçümden bu yana ${num1.format(Math.abs(diff))} kg ${yon} var.`
    : `Bu aralıkta ${num1.format(Math.abs(diff))} kg ${yon} var.`
}

/** Yağ oranı için eksik mezura ölçülerine davet */
export function bodyFatInvite(sex: Sex): string {
  return sex === 'kadin'
    ? 'Bel, boyun ve kalça ölçünü ekle; yağ oranını birlikte hesaplayalım 🌸'
    : 'Bel ve boyun ölçünü ekle; yağ oranını birlikte hesaplayalım 🌿'
}

/** 18 yaş altı için bilgilendirme notu */
export const MINOR_NOTE =
  '18 yaş altında bu formüller yaklaşıktır; çocuklarda değerlendirme yaş persentilleriyle yapılır.'
