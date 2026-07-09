import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { measurementRepo } from '../../data/repositories'
import { activityMeta } from '../../data/types'
import { formatLongTR, formatShortTR, todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { IconChevronRight, IconPencil, IconPlus, IconRuler, IconScale } from '../../ui/icons'
import {
  MINOR_NOTE,
  ageFromBirthDate,
  bmi,
  bmiRange,
  bmr,
  bodyFatInvite,
  bodyFatPercent,
  formatKcal,
  formatKg,
  formatNumber,
  tdee,
  trendMessage,
  type BmiRange,
} from './bodyMetrics'
import { BodySetupSheet } from './BodySetupSheet'
import { MeasurementSheet } from './MeasurementSheet'
import { MeasurementHistory } from './MeasurementHistory'
import { WeightSparkline } from './WeightSparkline'

const RANGE_PILL: Record<BmiRange['color'], string> = {
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
}

/** BMI aralık şeridi — 15–35 ölçeği, yumuşak renkler, konum işareti */
function BmiBar({ value }: { value: number }) {
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

export function BodyPage() {
  const { id: profileId, profile } = useActiveProfile()
  const [setupOpen, setSetupOpen] = useState(false)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [girthsFirst, setGirthsFirst] = useState(false)

  const measurements =
    useLiveQuery(
      () => (profileId ? measurementRepo.forProfile(profileId) : Promise.resolve([])),
      [profileId],
    ) ?? []

  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)

  // Eksik bilgide kurulum sheet'i bir kez kendiliğinden açılır
  const autoOpened = useRef(false)
  useEffect(() => {
    if (profile && !hasAttrs && !autoOpened.current) {
      autoOpened.current = true
      setSetupOpen(true)
    }
  }, [profile, hasAttrs])

  if (!profileId || !profile) return null

  const latest = measurements.at(-1)
  const prev = measurements.at(-2)
  const girthM = measurements.filter((m) => m.waistCm != null && m.neckCm != null).at(-1)

  const age = profile.birthDate ? ageFromBirthDate(profile.birthDate) : null
  const bmiVal = hasAttrs && latest ? bmi(latest.weightKg, profile.heightCm!) : null
  const bmrVal =
    hasAttrs && latest ? bmr(profile.sex!, latest.weightKg, profile.heightCm!, age!) : null
  const tdeeVal = bmrVal !== null ? tdee(bmrVal, profile.activityLevel!) : null
  const bfVal =
    hasAttrs && girthM
      ? bodyFatPercent(profile.sex!, profile.heightCm!, girthM.waistCm!, girthM.neckCm!, girthM.hipCm)
      : null

  const openMeasure = (girths: boolean) => {
    setGirthsFirst(girths)
    setMeasureOpen(true)
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-28">
      <header className="animate-slide-fade-in mb-4 flex items-center gap-2">
        <Link
          to="/"
          aria-label="Bugün ekranına dön"
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-faint active:bg-muted"
        >
          <IconChevronRight className="h-5 w-5 rotate-180" />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
            <IconScale className="h-6.5 w-6.5 text-violet-600 dark:text-violet-400" />
            Vücudum
          </h1>
          <p className="text-sm text-soft">{formatLongTR(todayISO())}</p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {!hasAttrs ? (
          <section className="animate-slide-fade-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 p-5 text-white shadow-md">
            <div className="pointer-events-none absolute -top-10 -left-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
            <IconScale className="pointer-events-none absolute -right-4 -bottom-8 h-32 w-32 opacity-15" strokeWidth={1.2} />
            <h2 className="relative text-xl font-extrabold">Seni tanıyalım 🌱</h2>
            <p className="relative mt-1 text-sm text-violet-50/90">
              Boyunu ve birkaç bilgiyi ekleyelim — BMI ve günlük enerji ihtiyacın kendiliğinden
              hesaplansın.
            </p>
            <button
              onClick={() => setSetupOpen(true)}
              className="relative mt-4 rounded-xl bg-white/20 px-5 py-2.5 font-semibold ring-1 ring-white/30 backdrop-blur-sm active:scale-95"
            >
              Başlayalım
            </button>
          </section>
        ) : !latest ? (
          <section className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="text-sm text-soft">Hazırsın! İlk kilo ölçümünü ekleyerek başla ✨</p>
            <button
              onClick={() => openMeasure(false)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              <IconPlus className="h-4.5 w-4.5" strokeWidth={2.4} />
              Ölçüm Ekle
            </button>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <section className="rounded-2xl bg-surface p-4 shadow-sm">
                <h2 className="text-sm font-bold text-soft">BMI</h2>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatNumber(bmiVal!)}</p>
                <span
                  className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${RANGE_PILL[bmiRange(bmiVal!).color]}`}
                >
                  {bmiRange(bmiVal!).label}
                </span>
                <BmiBar value={bmiVal!} />
              </section>

              <section className="rounded-2xl bg-surface p-4 shadow-sm">
                <h2 className="text-sm font-bold text-soft">Günlük Enerji</h2>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">{formatKcal(tdeeVal!)}</p>
                <p className="mt-1.5 text-xs text-soft">BMR: {formatKcal(bmrVal!)}</p>
                <p className="mt-1 text-xs text-faint">
                  {activityMeta(profile.activityLevel!).label} tempoda tahmini ihtiyaç — sadece
                  bilgi amaçlı.
                </p>
              </section>
            </div>

            <section className="rounded-2xl bg-surface p-4 shadow-sm">
              <h2 className="text-sm font-bold text-soft">Vücut Yağ Oranı</h2>
              {bfVal !== null ? (
                <>
                  <p className="mt-1 text-3xl font-extrabold tracking-tight">%{formatNumber(bfVal)}</p>
                  <p className="mt-1 text-xs text-faint">
                    US Navy yöntemi · {formatShortTR(girthM!.date)} mezura ölçümünden.
                  </p>
                </>
              ) : (
                <button
                  onClick={() => openMeasure(true)}
                  className="mt-2 flex w-full items-center gap-2.5 rounded-xl bg-violet-50 px-3.5 py-3 text-left text-sm text-violet-800 active:scale-[0.99] dark:bg-violet-950/50 dark:text-violet-200"
                >
                  <IconRuler className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                  {bodyFatInvite(profile.sex!)}
                </button>
              )}
            </section>

            {age !== null && age < 18 && <p className="px-1 text-xs text-faint">{MINOR_NOTE}</p>}

            <button
              onClick={() => openMeasure(false)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              <IconPlus className="h-4.5 w-4.5" strokeWidth={2.4} />
              Ölçüm Ekle
            </button>

            <section className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-bold">Kilo Yolculuğu</h2>
                <span className="text-sm font-semibold text-soft">{formatKg(latest.weightKg)}</span>
              </div>
              {measurements.length >= 2 ? (
                <>
                  <WeightSparkline
                    points={measurements.map((m) => ({ date: m.date, value: m.weightKg }))}
                    height={96}
                    showLabels
                    className="text-violet-500 dark:text-violet-400"
                  />
                  {prev && <p className="mt-2 text-sm text-soft">{trendMessage(prev.weightKg, latest.weightKg)}</p>}
                </>
              ) : (
                <p className="text-sm text-faint">İki ölçümden sonra burada kilonun yolculuğunu göreceksin 📈</p>
              )}
            </section>

            <MeasurementHistory measurements={measurements} />
          </>
        )}

        {hasAttrs && (
          <button
            onClick={() => setSetupOpen(true)}
            className="mx-auto flex items-center gap-1.5 py-1 text-sm font-medium text-violet-600 dark:text-violet-400"
          >
            <IconPencil className="h-4 w-4" />
            Bilgilerini düzenle
          </button>
        )}
      </div>

      <BodySetupSheet profile={profile} open={setupOpen} onClose={() => setSetupOpen(false)} />
      <MeasurementSheet
        profileId={profileId}
        sex={profile.sex}
        latest={latest}
        open={measureOpen}
        girthsOpen={girthsFirst}
        onClose={() => setMeasureOpen(false)}
      />
    </div>
  )
}
