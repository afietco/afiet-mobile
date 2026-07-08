import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '../../data/repositories'
import { MEAL_TYPES, type MealType } from '../../data/types'
import { todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { TodayHeader } from './TodayHeader'
import { MealCard } from './MealCard'
import { AddFoodSheet } from './AddFoodSheet'
import { WaterCounter } from './WaterCounter'
import { BalanceSummary } from './BalanceSummary'

export function TodayPage() {
  const { id: profileId, profile } = useActiveProfile()
  const [addingTo, setAddingTo] = useState<MealType | null>(null)
  const date = todayISO()

  const entries =
    useLiveQuery(
      () => (profileId ? mealRepo.forDay(profileId, date) : Promise.resolve([])),
      [profileId, date],
    ) ?? []

  if (!profileId) return null

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-28">
      <TodayHeader profileId={profileId} profile={profile ?? undefined} />

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
