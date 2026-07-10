import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { measurementRepo } from '../../data/repositories'
import type { Profile } from '@afiet/core'
import { formatShortTR, relativeDayLabel } from '@afiet/core'
import {
  ageFromBirthDate,
  bmi,
  bmiRange,
  bmr,
  bodyFatPercent,
  formatNumber,
  tdee,
} from '@afiet/core'
import { RANGE_DOT } from '../body/BmiSheet'
import { CardHeader } from '../../ui/CardHeader'
import { IconScale } from '../../ui/icons'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/60 px-2.5 py-2">
      <p className="text-[11px] font-medium text-faint">{label}</p>
      <p className="mt-0.5 flex items-baseline gap-1 text-lg font-extrabold tracking-tight">
        {children}
      </p>
    </div>
  )
}

/** Dashboard Vücudum kartı — kilo/BMI/yağ (ya da enerji) özeti + mini trend */
export function BodyCard({ profileId, profile }: { profileId: number; profile?: Profile }) {
  const navigate = useNavigate()
  const measurements =
    useLiveQuery(() => measurementRepo.forProfile(profileId), [profileId]) ?? []

  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  const latest = measurements.at(-1)
  const prev = measurements.at(-2)
  const girthM = measurements.filter((m) => m.waistCm != null && m.neckCm != null).at(-1)

  const bmiVal = hasAttrs && latest ? bmi(latest.weightKg, profile!.heightCm!) : null
  const bfVal =
    hasAttrs && girthM
      ? bodyFatPercent(profile!.sex!, profile!.heightCm!, girthM.waistCm!, girthM.neckCm!, girthM.hipCm)
      : null
  const tdeeVal =
    hasAttrs && latest
      ? tdee(
          bmr(profile!.sex!, latest.weightKg, profile!.heightCm!, ageFromBirthDate(profile!.birthDate!)),
          profile!.activityLevel!,
        )
      : null
  const diff = latest && prev ? latest.weightKg - prev.weightKg : null

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={() => navigate('/vucudum')}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/vucudum')}
      className="cursor-pointer rounded-2xl bg-surface p-4 shadow-sm transition-shadow active:shadow-md"
    >
      <CardHeader
        icon={<IconScale className="h-5.5 w-5.5" />}
        iconBg="bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400"
        title="Vücudum"
        chevron
        meta={
          latest && (
            <span className="text-sm text-soft">
              {relativeDayLabel(latest.date) ?? formatShortTR(latest.date)}
            </span>
          )
        }
      />

      {!hasAttrs ? (
        <p className="text-sm text-soft">
          Boyunu ve birkaç bilgiyi ekleyelim — BMI ve günlük enerji ihtiyacın kendiliğinden
          hesaplansın 🌱
        </p>
      ) : !latest ? (
        <p className="text-sm text-soft">Hazırsın! İlk kilo ölçümünü ekleyerek başla ✨</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Kilo">
              {formatNumber(latest.weightKg)}
              <span className="text-xs font-semibold text-soft">kg</span>
              {diff !== null && Math.abs(diff) >= 0.05 && (
                <span className="text-[11px] font-medium text-faint">
                  {diff < 0 ? '↓' : '↑'}{formatNumber(Math.abs(diff))}
                </span>
              )}
            </Stat>
            <Stat label="BMI">
              {formatNumber(bmiVal!)}
              <span className={`h-2 w-2 shrink-0 self-center rounded-full ${RANGE_DOT[bmiRange(bmiVal!).color]}`} />
            </Stat>
            {bfVal !== null ? (
              <Stat label="Yağ">
                %{formatNumber(bfVal)}
              </Stat>
            ) : (
              <Stat label="Enerji">
                {num0.format(Math.round(tdeeVal!))}
                <span className="text-xs font-semibold text-soft">kcal</span>
              </Stat>
            )}
          </div>
        </>
      )}
    </section>
  )
}
