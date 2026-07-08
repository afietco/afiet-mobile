import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '../../data/repositories'
import { MEAL_TYPES, type MealType } from '../../data/types'
import { addDays, formatLongTR, relativeDayLabel, todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { MealCard } from './MealCard'
import { AddFoodSheet } from './AddFoodSheet'
import { WaterCounter } from './WaterCounter'
import { BalanceSummary } from './BalanceSummary'

export function TodayPage() {
  const { id: profileId, profile } = useActiveProfile()
  const [date, setDate] = useState(todayISO())
  const [addingTo, setAddingTo] = useState<MealType | null>(null)

  const entries =
    useLiveQuery(
      () => (profileId ? mealRepo.forDay(profileId, date) : Promise.resolve([])),
      [profileId, date],
    ) ?? []

  if (!profileId) return null

  const isToday = date === todayISO()
  const dayLabel = relativeDayLabel(date)

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-28">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Merhaba {profile?.emoji} {profile?.name}</p>
          <h1 className="text-xl font-extrabold text-slate-800">
            {dayLabel ?? formatLongTR(date)}
          </h1>
          {dayLabel && <p className="text-xs text-slate-400">{formatLongTR(date)}</p>}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            aria-label="Önceki gün"
            className="h-10 w-10 rounded-full bg-white text-slate-500 shadow-sm active:scale-95"
          >
            ‹
          </button>
          {!isToday && (
            <button
              onClick={() => setDate(todayISO())}
              className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700"
            >
              Bugün
            </button>
          )}
          <button
            onClick={() => setDate((d) => addDays(d, 1))}
            disabled={isToday}
            aria-label="Sonraki gün"
            className="h-10 w-10 rounded-full bg-white text-slate-500 shadow-sm active:scale-95 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <BalanceSummary entries={entries} />
        {MEAL_TYPES.map((m) => (
          <MealCard
            key={m.key}
            meal={m.key}
            entries={entries.filter((e) => e.meal === m.key)}
            onAdd={() => setAddingTo(m.key)}
          />
        ))}
        <WaterCounter profileId={profileId} date={date} />
      </div>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        meal={addingTo}
        onClose={() => setAddingTo(null)}
      />
    </div>
  )
}
