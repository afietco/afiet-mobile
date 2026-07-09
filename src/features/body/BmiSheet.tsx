import type { Measurement, Profile } from '../../data/types'
import { Sheet } from '../../ui/Sheet'
import { IconTarget } from '../../ui/icons'
import { BMI_RANGES, bmi, bmiRange, formatNumber, type BmiRange } from './bodyMetrics'
import { RangedTrend } from './RangedTrend'

/** BMI aralık pill'i renkleri — kart ve sheet'lerde ortak */
export const RANGE_PILL: Record<BmiRange['color'], string> = {
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
}

const RANGE_DOT: Record<BmiRange['color'], string> = {
  sky: 'bg-sky-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
}

/** BMI aralık şeridi — 15–35 ölçeği, yumuşak renkler, konum işareti */
export function BmiBar({ value }: { value: number }) {
  const pct = Math.min(Math.max((value - 15) / 20, 0), 1) * 100
  return (
    <div className="relative mt-3">
      <div className="flex h-2 overflow-hidden rounded-full opacity-70">
        <div className="bg-sky-300 dark:bg-sky-800" style={{ width: '17.5%' }} />
        <div className="bg-emerald-300 dark:bg-emerald-800" style={{ width: '32.5%' }} />
        <div className="bg-amber-300 dark:bg-amber-800" style={{ width: '25%' }} />
        <div className="bg-rose-300 dark:bg-rose-800" style={{ width: '25%' }} />
      </div>
      <div
        className="absolute -top-1 h-4 w-1.5 -translate-x-1/2 rounded-full bg-ink ring-2 ring-surface"
        style={{ left: `${pct}%` }}
      />
    </div>
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
          <IconTarget className="h-5.5 w-5.5 text-violet-600 dark:text-violet-400" />
          BMI
        </>
      }
    >
      {current !== null && (
        <div className="mb-4 rounded-2xl bg-muted p-4">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-extrabold tracking-tight">{formatNumber(current)}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RANGE_PILL[bmiRange(current).color]}`}
            >
              {bmiRange(current).label}
            </span>
          </div>
          <BmiBar value={current} />
        </div>
      )}

      <p className="mb-4 text-sm text-soft">
        BMI (vücut kitle indeksi), kilonun boya oranına dayanan kaba bir göstergedir:
        kilo ÷ boy². Kas kütlesini, yaşı ve vücut tipini ayırt etmez; tek başına bir sağlık
        ölçüsü değil, genel bir pusuladır. Anlık değerden çok zaman içindeki gidişatı
        izlemek anlamlıdır. 🌿
      </p>

      <div className="mb-5 flex flex-col gap-1.5">
        {BMI_RANGES.map((r) => (
          <div key={r.key} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${RANGE_DOT[r.color]}`} />
              <span className={current !== null && bmiRange(current).key === r.key ? 'font-semibold' : 'text-soft'}>
                {r.label}
              </span>
            </span>
            <span className="text-faint">{rangeInterval(r)}</span>
          </div>
        ))}
      </div>

      {points.length >= 2 && (
        <div className="mb-2">
          <h3 className="mb-1 font-bold">BMI Gelişimi</h3>
          <RangedTrend
            points={points}
            height={80}
            className="text-violet-500 dark:text-violet-400"
            label="BMI değişim grafiği"
          />
        </div>
      )}
    </Sheet>
  )
}
