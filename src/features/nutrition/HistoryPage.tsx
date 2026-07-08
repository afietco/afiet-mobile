import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo, waterRepo } from '../../data/repositories'
import {
  CORE_GROUPS,
  MEAL_TYPES,
  WATER_TARGET_GLASSES,
  type MealEntry,
} from '../../data/types'
import { GroupIcon, MealIcon } from '../../ui/appIcons'
import { IconChevronRight, IconDrop, IconFlame } from '../../ui/icons'
import { addDays, formatLongTR, formatShortTR, relativeDayLabel, todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { Sheet } from '../../ui/Sheet'
import { BalanceSummary } from './BalanceSummary'
import { calcStreak, dayBalance } from './insights'

const DAYS = 7

function DayDetailSheet({
  date,
  entries,
  glasses,
  onClose,
}: {
  date: string | null
  entries: MealEntry[]
  glasses: number
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
              {glasses}/{WATER_TARGET_GLASSES} bardak
            </span>
          </div>

          {mealsWithEntries.length === 0 ? (
            <p className="py-2 text-center text-sm text-faint">Bu güne kayıt girilmemiş.</p>
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
  const { id: profileId } = useActiveProfile()
  const today = todayISO()
  const from = addDays(today, -(DAYS - 1))
  const [openDate, setOpenDate] = useState<string | null>(null)

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
  const loggedDates = useLiveQuery(
    () => (profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId],
  )

  if (!profileId) return null

  const streak = calcStreak(loggedDates ?? [])
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, -i))

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
        {days.map((date) => {
          const dayEntries = meals.filter((m) => m.date === date)
          const balance = dayBalance(dayEntries)
          const glasses = water.find((w) => w.date === date)?.glasses ?? 0
          const label = relativeDayLabel(date) ?? formatShortTR(date)
          return (
            <button
              key={date}
              onClick={() => setOpenDate(date)}
              className="flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left shadow-sm active:scale-[0.99]"
            >
              <div className="w-20 shrink-0">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-faint">{dayEntries.length} kayıt</p>
              </div>
              <div className="flex flex-1 items-center gap-1">
                {CORE_GROUPS.map((g) => (
                  <div
                    key={g}
                    className={`h-2 flex-1 rounded-full ${
                      balance.covered.includes(g) ? 'bg-emerald-400' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <div className="w-16 shrink-0 text-right">
                <p className="text-sm font-semibold text-soft">{balance.score}/5</p>
                <p className="flex items-center justify-end gap-0.5 text-xs text-sky-500">
                  <IconDrop className="h-3.5 w-3.5" />
                  {glasses}/{WATER_TARGET_GLASSES}
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
        onClose={() => setOpenDate(null)}
      />
    </div>
  )
}
