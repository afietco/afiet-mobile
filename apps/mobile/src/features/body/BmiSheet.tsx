import {
  BMI_RANGES,
  bmi,
  bmiRange,
  formatNumber,
  type BmiRange,
  type Measurement,
  type Profile,
} from '@afiet/core'
import { View } from 'react-native'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconTarget } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'
import { RangedTrend } from './RangedTrend'

/* Web BmiSheet.tsx portu. RANGE_PILL native'de {kutu, metin} sınıf çifti —
   RN'de renk üst öğeden metne inmez. */

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
export function BmiBar({ value }: { value: number }) {
  const pct = Math.min(Math.max((value - 15) / 20, 0), 1) * 100
  return (
    <View className="relative mt-3">
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

function rangeInterval(r: BmiRange): string {
  if (r.min === 0) return `${formatNumber(r.max)} altı`
  if (r.max === 99) return `${formatNumber(r.min)} üzeri`
  return `${formatNumber(r.min)} – ${formatNumber(r.max)}`
}

interface BmiSheetProps {
  profile: Profile
  measurements: Measurement[]
  open: boolean
  onClose: () => void
}

/** BMI detayı — kısa açıklama, aralıklar ve zaman içindeki gelişim */
export function BmiSheet({ profile, measurements, open, onClose }: BmiSheetProps) {
  const { isDark } = useTheme()
  const heightCm = profile.heightCm
  const latest = measurements.at(-1)
  const current = heightCm && latest ? bmi(latest.weightKg, heightCm) : null
  const points =
    heightCm != null
      ? measurements.map((m) => ({ date: m.date, value: bmi(m.weightKg, heightCm) }))
      : []

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconTarget size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />
          <AppText weight="bold" className="text-lg text-ink">
            BMI
          </AppText>
        </>
      }
    >
      {current !== null && (
        <View className="mb-4 rounded-2xl bg-muted p-4">
          <View className="flex-row items-center justify-between">
            <AppText weight="extrabold" className="text-3xl text-ink">
              {formatNumber(current)}
            </AppText>
            <View className={`rounded-full px-2.5 py-0.5 ${RANGE_PILL[bmiRange(current).color].box}`}>
              <AppText
                weight="semibold"
                className={`text-xs ${RANGE_PILL[bmiRange(current).color].text}`}
              >
                {bmiRange(current).label}
              </AppText>
            </View>
          </View>
          <BmiBar value={current} />
        </View>
      )}

      <AppText className="mb-4 text-sm text-soft">
        BMI (vücut kitle indeksi), kilonun boya oranına dayanan kaba bir göstergedir: kilo ÷
        boy². Kas kütlesini, yaşı ve vücut tipini ayırt etmez; tek başına bir sağlık ölçüsü
        değil, genel bir pusuladır. Anlık değerden çok zaman içindeki gidişatı izlemek
        anlamlıdır. 🌿
      </AppText>

      <View className="mb-5 gap-1.5">
        {BMI_RANGES.map((r) => (
          <View key={r.key} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${RANGE_DOT[r.color]}`} />
              <AppText
                weight={current !== null && bmiRange(current).key === r.key ? 'semibold' : 'normal'}
                className={`text-sm ${
                  current !== null && bmiRange(current).key === r.key ? 'text-ink' : 'text-soft'
                }`}
              >
                {r.label}
              </AppText>
            </View>
            <AppText className="text-sm text-faint">{rangeInterval(r)}</AppText>
          </View>
        ))}
      </View>

      {points.length >= 2 && (
        <View className="mb-2">
          <AppText weight="bold" className="mb-1 text-ink">
            BMI Gelişimi
          </AppText>
          <RangedTrend
            points={points}
            height={80}
            color={isDark ? '#a78bfa' : '#8b5cf6'}
            label="BMI değişim grafiği"
            refBand={{ from: 18.5, to: 25 }}
          />
        </View>
      )}
    </Sheet>
  )
}
