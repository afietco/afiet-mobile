import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { measurementRepo } from '../../data/repositories'
import { activityMeta } from '../../data/types'
import { formatLongTR, formatShortTR, todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { Sheet } from '../../ui/Sheet'
import {
  IconCalendar,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconRuler,
  IconScale,
} from '../../ui/icons'
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
} from './bodyMetrics'
import { BmiBar, BmiSheet, RANGE_PILL } from './BmiSheet'
import { BodySetupSheet } from './BodySetupSheet'
import { MeasurementSheet } from './MeasurementSheet'
import { MeasurementHistory } from './MeasurementHistory'
import { RangedTrend } from './RangedTrend'

export function BodyPage() {
  const { id: profileId, profile } = useActiveProfile()
  const [setupOpen, setSetupOpen] = useState(false)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [girthsFirst, setGirthsFirst] = useState(false)
  const [bmiOpen, setBmiOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [journeyTab, setJourneyTab] = useState<'kilo' | 'yag'>('kilo')

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

  const weightPoints = measurements.map((m) => ({ date: m.date, value: m.weightKg }))
  const fatPoints = hasAttrs
    ? measurements
        .filter((m) => m.waistCm != null && m.neckCm != null)
        .map((m) => ({
          date: m.date,
          value: bodyFatPercent(profile.sex!, profile.heightCm!, m.waistCm!, m.neckCm!, m.hipCm),
        }))
        .filter((p): p is { date: string; value: number } => p.value !== null)
    : []
  const showFatTab = fatPoints.length >= 1
  const activeTab = journeyTab === 'yag' && showFatTab ? 'yag' : 'kilo'

  const openMeasure = (girths: boolean) => {
    setGirthsFirst(girths)
    setMeasureOpen(true)
  }

  const tabCls = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
      active
        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
        : 'text-soft'
    }`

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
              <section
                role="button"
                tabIndex={0}
                onClick={() => setBmiOpen(true)}
                onKeyDown={(e) => e.key === 'Enter' && setBmiOpen(true)}
                className="cursor-pointer rounded-2xl bg-surface p-4 shadow-sm transition-shadow active:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-soft">BMI</h2>
                  <IconChevronRight className="h-4 w-4 text-faint" />
                </div>
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

            <div className="flex gap-2">
              <button
                onClick={() => openMeasure(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3.5 font-semibold text-white active:scale-[0.98]"
              >
                <IconPlus className="h-4.5 w-4.5" strokeWidth={2.4} />
                Ölçüm Ekle
              </button>
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-violet-600 bg-surface px-4 font-semibold text-violet-700 active:scale-[0.98] dark:border-violet-500 dark:text-violet-400"
              >
                <IconCalendar className="h-4.5 w-4.5" />
                Geçmiş
              </button>
            </div>

            <section className="rounded-2xl bg-surface p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                {showFatTab ? (
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setJourneyTab('kilo')} className={tabCls(activeTab === 'kilo')}>
                      Kilo
                    </button>
                    <button type="button" onClick={() => setJourneyTab('yag')} className={tabCls(activeTab === 'yag')}>
                      Yağ Oranı
                    </button>
                  </div>
                ) : (
                  <h2 className="font-bold">Kilo Yolculuğu</h2>
                )}
                <span className="text-sm font-semibold text-soft">
                  {activeTab === 'kilo' ? formatKg(latest.weightKg) : bfVal !== null ? `%${formatNumber(bfVal)}` : ''}
                </span>
              </div>
              {activeTab === 'kilo' ? (
                measurements.length >= 2 ? (
                  <>
                    <RangedTrend
                      points={weightPoints}
                      height={96}
                      className="text-violet-500 dark:text-violet-400"
                    />
                    {prev && <p className="mt-2 text-sm text-soft">{trendMessage(prev.weightKg, latest.weightKg)}</p>}
                  </>
                ) : (
                  <p className="text-sm text-faint">İki ölçümden sonra burada kilonun yolculuğunu göreceksin 📈</p>
                )
              ) : fatPoints.length >= 2 ? (
                <RangedTrend
                  points={fatPoints}
                  height={96}
                  className="text-violet-500 dark:text-violet-400"
                  label="Vücut yağ oranı değişim grafiği"
                />
              ) : (
                <p className="text-sm text-faint">
                  İki mezura ölçümünden sonra burada yağ oranının yolculuğunu göreceksin 📈
                </p>
              )}
            </section>
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
      <BmiSheet profile={profile} measurements={measurements} open={bmiOpen} onClose={() => setBmiOpen(false)} />
      <Sheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={
          <>
            <IconCalendar className="h-5.5 w-5.5 text-violet-600 dark:text-violet-400" />
            Ölçüm Geçmişi
          </>
        }
      >
        <MeasurementHistory measurements={measurements} />
      </Sheet>
    </div>
  )
}
