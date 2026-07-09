import { useState } from 'react'
import { todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { AddFoodSheet } from '../nutrition/AddFoodSheet'
import { WaterCounter } from '../nutrition/WaterCounter'
import { TodayHeader } from './TodayHeader'
import { NutritionCard } from './NutritionCard'
import { BodyCard } from './BodyCard'

/** Bugün — kart panosu: Beslenme, Vücudum, Su */
export function HomePage() {
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const date = todayISO()

  if (!profileId) return null

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-28">
      <TodayHeader profileId={profileId} profile={profile ?? undefined} />

      <div className="flex flex-col gap-3">
        <NutritionCard profileId={profileId} date={date} onAdd={() => setAdding(true)} />
        <BodyCard profileId={profileId} profile={profile ?? undefined} />
        <WaterCounter profileId={profileId} date={date} />
      </div>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        open={adding}
        meal={null}
        onClose={() => setAdding(false)}
      />
    </div>
  )
}
