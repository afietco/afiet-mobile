import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo, measurementRepo, waterRepo } from '../../data/repositories'
import {
  CORE_GROUPS,
  MEAL_TYPES,
  type MealEntry,
  type Measurement,
} from '../../data/types'
import { useWaterTarget } from '../body/useWaterTarget'
import { formatNumber } from '../body/bodyMetrics'
import { GroupIcon, MealIcon } from '../../ui/appIcons'
import { IconChevronRight, IconDrop, IconFlame, IconScale } from '../../ui/icons'
import { addDays, formatLongTR, formatShortTR, fromISO, relativeDayLabel, todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { Sheet } from '../../ui/Sheet'
import { BalanceSummary } from './BalanceSummary'
import { calcStreak, dayBalance } from './insights'

const DAYS = 7

const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' })

function DayDetailSheet({
  date,
  entries,
  glasses,
  waterTarget,
  measurement,
  onClose,
}: {
  date: string | null
  entries: MealEntry[]
  glasses: number
  waterTarget: number
  measurement?: Measurement
  onClose: () => void
}) {
  const mealsWithEntries = MEAL_TYPES.filter((m) => entries.some((e) => e.meal === m.key))
  return (
    <Sheet
      open={date !== null}
      onClose={onClose}
      title={date ? (relativeDayLabel(date) ?? formatShortTR(date)) : ''}
    >
      {date && (
        <>
          <p className="-mt-3 mb-3 text-sm text-faint">{formatLongTR(date)}</p>
          <div className="flex flex-col gap-3 rounded-2xl bg-canvas p-3">
            <BalanceSummary entries={entries} />

          <div className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-sm">
            <h2 className="flex items-center gap-2 font-bold">
              <IconDrop className="h-5 w-5 text-sky-500" />
              Su
            </h2>
            <span className="text-sm font-semibold text-sky-500">
              {glasses}/{waterTarget} bardak
            </span>
          </div>

          {measurement && (
            <div className="animate-slide-fade-in flex items-center gap-3 rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/40">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                <IconScale className="h-5.5 w-5.5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-violet-800 dark:text-violet-200">
                  Bu gün ölçüm alındı
                </p>
                <p className="text-sm text-violet-700/90 dark:text-violet-300/90">
                  {formatNumber(measurement.weightKg)} kg
                  {measurement.waistCm != null && ` · Bel ${formatNumber(measurement.waistCm)}`}
                  {measurement.neckCm != null && ` · Boyun ${formatNumber(measurement.neckCm)}`}
                  {measurement.hipCm != null && ` · Kalça ${formatNumber(measurement.hipCm)}`}
                </p>
              </div>
            </div>
          )}

          {mealsWithEntries.length === 0 ? (
            <p className="py-2 text-center text-sm text-faint">Bu güne öğün girilmemiş.</p>
          ) : (
            mealsWithEntries.map((m) => (
              <div key={m.key} className="rounded-2xl bg-surface p-4 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 font-bold">
                  <MealIcon meal={m.key} className="h-5 w-5" />
                  {m.label}
                </h2>
                <ul className="flex flex-col gap-1.5">
                  {entries
                    .filter((e) => e.meal === m.key)
                    .map((e) => (
                      <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 truncate text-ink">{e.foodName}</span>
                        {e.groups.length > 0 && (
                          <span className="flex shrink-0 items-center gap-1">
                            {e.groups.map((g) => (
                              <GroupIcon key={g} group={g} className="h-4 w-4" />
                            ))}
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))
          )}
          </div>
        </>
      )}
    </Sheet>
  )
}

export function HistoryPage() {
  const { id: profileId, profile } = useActiveProfile()
  const today = todayISO()
  const from = addDays(today, -(DAYS - 1))
  const [openDate, setOpenDate] = useState<string | null>(null)
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)

  const meals =
    useLiveQuery(
      () => (profileId ? mealRepo.forRange(profileId, from, today) : Promise.resolve([])),
      [profileId, from, today],
    ) ?? []
  const water =
    useLiveQuery(
      () => (profileId ? waterRepo.forRange(profileId, from, today) : Promise.resolve([])),
      [profileId, from, today],
    ) ?? []
  const measurements =
    useLiveQuery(
      () => (profileId ? measurementRepo.forRange(profileId, from, today) : Promise.resolve([])),
      [profileId, from, today],
    ) ?? []
  const loggedDates = useLiveQuery(
    () => (profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId],
  )
  const firstMeasurement = useLiveQuery(
    () =>
      profileId
        ? measurementRepo.forProfile(profileId).then((ms) => ms[0]?.date)
        : Promise.resolve(undefined),
    [profileId],
  )

  if (!profileId) return null

  const streak = calcStreak(loggedDates ?? [])

  // İlk kayıttan (öğün / su / ölçüm) önceki günler listelenmez
  const firstDates = [
    loggedDates?.[0],
    water.map((w) => w.date).sort()[0],
    firstMeasurement,
  ].filter((d): d is string => !!d)
  const firstDate = firstDates.length > 0 ? firstDates.sort()[0] : today
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, -i)).filter(
    (d) => d >= firstDate,
  )

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-28">
      <h1 className="mb-4 text-xl font-extrabold">Geçmiş</h1>

      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-4 text-white shadow-sm">
        <IconFlame className="h-9 w-9 text-amber-300" />
        <div>
          <p className="text-2xl leading-tight font-extrabold">{streak} gün</p>
          <p className="text-sm text-emerald-50">
            {streak > 0 ? 'kesintisiz kayıt serisi — devam et!' : 'Bugün kayıt ekleyerek seri başlat!'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {days.map((date, i) => {
          const dayEntries = meals.filter((m) => m.date === date)
          const balance = dayBalance(dayEntries)
          const glasses = water.find((w) => w.date === date)?.glasses ?? 0
          const measured = measurements.some((m) => m.date === date)
          const d = fromISO(date)
          return (
            <button
              key={date}
              onClick={() => setOpenDate(date)}
              className="animate-slide-fade-in flex w-full items-center gap-3 rounded-2xl bg-surface p-3 text-left shadow-sm active:scale-[0.99]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-muted">
                <span className="text-sm leading-none font-extrabold">{dayFmt.format(d)}</span>
                <span className="mt-0.5 text-[10px] leading-none text-faint">{monthFmt.format(d)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {relativeDayLabel(date) ?? weekdayFmt.format(d)}
                  {measured && (
                    <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                      <IconScale className="h-3 w-3" />
                    </span>
                  )}
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  {CORE_GROUPS.map((g) => (
                    <div
                      key={g}
                      className={`h-1.5 flex-1 rounded-full ${
                        balance.covered.includes(g) ? 'bg-emerald-400' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                    balance.score >= 4
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                      : balance.score >= 2
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                        : 'bg-muted text-soft'
                  }`}
                >
                  {balance.score}/5
                </span>
                <p className="mt-1 flex items-center justify-end gap-0.5 text-xs text-sky-500">
                  <IconDrop className="h-3.5 w-3.5" />
                  {glasses}/{waterTarget}
                </p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-faint" />
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs text-faint">
        Çubuklar günün kapsadığı 5 temel besin grubunu gösterir. Detay için güne dokun.
      </p>

      <DayDetailSheet
        date={openDate}
        entries={meals.filter((m) => m.date === openDate)}
        glasses={water.find((w) => w.date === openDate)?.glasses ?? 0}
        waterTarget={waterTarget}
        measurement={measurements.find((m) => m.date === openDate)}
        onClose={() => setOpenDate(null)}
      />
    </div>
  )
}
