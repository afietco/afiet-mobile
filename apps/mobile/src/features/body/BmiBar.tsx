import type { BmiRange } from '@afiet/core'
import { View } from 'react-native'

/* Paylaşılan BMI görselleri — BMI detay sheet'i kalktı (bar ve gelişim
   grafiği artık Veri Ekranı'nda), kalanlar burada yaşıyor.
   RANGE_PILL native'de {kutu, metin} sınıf çifti — RN'de renk üst öğeden
   metne inmez. */

export const RANGE_PILL: Record<BmiRange['color'], { box: string; text: string }> = {
  sky: { box: 'bg-sky-100 dark:bg-sky-900/60', text: 'text-sky-700 dark:text-sky-300' },
  emerald: {
    box: 'bg-emerald-100 dark:bg-emerald-900/60',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: { box: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300' },
  rose: { box: 'bg-rose-100 dark:bg-rose-900/50', text: 'text-rose-700 dark:text-rose-300' },
}

export const RANGE_DOT: Record<BmiRange['color'], string> = {
  sky: 'bg-sky-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
}

/** BMI aralık şeridi — 15–35 ölçeği, yumuşak renkler, konum işareti */
export function BmiBar({ value, className = 'mt-3' }: { value: number; className?: string }) {
  const pct = Math.min(Math.max((value - 15) / 20, 0), 1) * 100
  return (
    <View className={`relative ${className}`}>
      {/* Koyu temada *-800 tonları zeminde kayboluyordu; canlı ton + saydamlık */}
      <View className="h-2 flex-row overflow-hidden rounded-full opacity-70 dark:opacity-100">
        <View className="bg-sky-300 dark:bg-sky-500/60" style={{ width: '17.5%' }} />
        <View className="bg-emerald-300 dark:bg-emerald-500/60" style={{ width: '32.5%' }} />
        <View className="bg-amber-300 dark:bg-amber-500/60" style={{ width: '25%' }} />
        <View className="bg-rose-300 dark:bg-rose-500/60" style={{ width: '25%' }} />
      </View>
      <View
        className="absolute -top-1 h-4 w-1.5 rounded-full border-2 border-surface bg-ink"
        style={{ left: `${pct}%`, marginLeft: -3 }}
      />
    </View>
  )
}
