import { bmiRange } from '@afiet/core'

interface MacroValues {
  kcal: number
  protein: number
  carb: number
  fat: number
}

interface MacroTargets {
  energyKcal: number
  protein: number
  carb: number
  fat: number
}

const number = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

function progressLabel(label: string, value: number, target: number, unit: string): string {
  const percent = target > 0 ? Math.round((value / target) * 100) : 0
  return `${label}: ${number.format(value)} / ${number.format(target)} ${unit}, yüzde ${percent}`
}

export function macroRingsLabel(nutrition: MacroValues, targets: MacroTargets): string {
  return [
    'Günlük makro özeti',
    progressLabel('Enerji', nutrition.kcal, targets.energyKcal, 'kilokalori'),
    progressLabel('Protein', nutrition.protein, targets.protein, 'gram'),
    progressLabel('Karbonhidrat', nutrition.carb, targets.carb, 'gram'),
    progressLabel('Yağ', nutrition.fat, targets.fat, 'gram'),
  ].join('. ')
}

export function rhythmStripLabel(week: boolean[], todayIndex: number): string {
  const loggedDays = week
    .map((filled, index) => (filled ? DAY_NAMES[index] : null))
    .filter((day): day is string => day !== null)
  const parts = [`Afiyet ritmi. ${loggedDays.length} / ${week.length} afiyet günü`]
  if (loggedDays.length > 0) parts.push(`Kayıt olan günler: ${loggedDays.join(', ')}`)
  if (todayIndex >= 0 && todayIndex < week.length) {
    parts.push(week[todayIndex] ? 'Bugün afiyet günü' : 'Bugün için henüz kayıt yok')
  }
  return parts.join('. ')
}

export function bmiBarLabel(value: number): string {
  return `Vücut kitle indeksi ${number.format(value)}. ${bmiRange(value).label}`
}

export function balanceRingsLabel(covered: string[], missing: string[]): string {
  const total = covered.length + missing.length
  const parts = [`Günlük besin dengesi. ${covered.length} / ${total} temel grup mevcut`]
  if (covered.length > 0) parts.push(`Mevcut gruplar: ${covered.join(', ')}`)
  if (missing.length > 0) parts.push(`Henüz yer almayan gruplar: ${missing.join(', ')}`)
  return parts.join('. ')
}
