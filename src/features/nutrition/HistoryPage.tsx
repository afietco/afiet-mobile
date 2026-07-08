import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo, waterRepo } from '../../data/repositories'
import { CORE_GROUPS, WATER_TARGET_GLASSES } from '../../data/types'
import { addDays, formatShortTR, relativeDayLabel, todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { calcStreak, dayBalance } from './insights'

const DAYS = 7

export function HistoryPage() {
  const { id: profileId } = useActiveProfile()
  const today = todayISO()
  const from = addDays(today, -(DAYS - 1))

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
        <span className="text-3xl">🔥</span>
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
            <div key={date} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
              <div className="w-20 shrink-0">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-slate-400">{dayEntries.length} kayıt</p>
              </div>
              <div className="flex flex-1 items-center gap-1">
                {CORE_GROUPS.map((g) => (
                  <div
                    key={g}
                    className={`h-2 flex-1 rounded-full ${
                      balance.covered.includes(g) ? 'bg-emerald-400' : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>
              <div className="w-16 shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-600">{balance.score}/5</p>
                <p className="text-xs text-sky-500">
                  💧 {glasses}/{WATER_TARGET_GLASSES}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Çubuklar günün kapsadığı 5 temel besin grubunu gösterir.
      </p>
    </div>
  )
}
