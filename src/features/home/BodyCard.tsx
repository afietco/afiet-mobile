import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { measurementRepo } from '../../data/repositories'
import type { Profile } from '../../data/types'
import { bmi, bmiRange, formatKg, formatNumber } from '../body/bodyMetrics'
import { WeightSparkline } from '../body/WeightSparkline'
import { IconChevronRight, IconScale } from '../../ui/icons'

const RANGE_PILL = {
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
} as const

/** Dashboard Vücudum kartı — son kilo + BMI özeti ya da başlangıç daveti */
export function BodyCard({ profileId, profile }: { profileId: number; profile?: Profile }) {
  const navigate = useNavigate()
  const measurements =
    useLiveQuery(() => measurementRepo.forProfile(profileId), [profileId]) ?? []

  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  const latest = measurements.at(-1)
  const bmiVal = hasAttrs && latest ? bmi(latest.weightKg, profile!.heightCm!) : null

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={() => navigate('/vucudum')}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/vucudum')}
      className="cursor-pointer rounded-2xl bg-surface p-4 shadow-sm transition-shadow active:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <IconScale className="h-5.5 w-5.5 text-violet-600 dark:text-violet-400" />
          Vücudum
        </h2>
        <IconChevronRight className="h-5 w-5 text-faint" />
      </div>

      {!hasAttrs ? (
        <p className="text-sm text-soft">
          Boyunu ve birkaç bilgiyi ekleyelim — BMI ve günlük enerji ihtiyacın kendiliğinden
          hesaplansın 🌱
        </p>
      ) : !latest ? (
        <p className="text-sm text-soft">Hazırsın! İlk kilo ölçümünü ekleyerek başla ✨</p>
      ) : (
        <div className="flex items-center gap-3">
          <div className="min-w-0 shrink-0">
            <p className="text-2xl font-extrabold tracking-tight">{formatKg(latest.weightKg)}</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${RANGE_PILL[bmiRange(bmiVal!).color]}`}
            >
              BMI {formatNumber(bmiVal!)} · {bmiRange(bmiVal!).label}
            </span>
          </div>
          {measurements.length >= 2 && (
            <div className="min-w-0 flex-1 text-violet-500 dark:text-violet-400">
              <WeightSparkline
                points={measurements.map((m) => ({ date: m.date, value: m.weightKg }))}
                height={40}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}
