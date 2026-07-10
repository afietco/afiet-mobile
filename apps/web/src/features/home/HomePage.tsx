import { useState } from 'react'
import { Link } from 'react-router'
import { todayISO } from '@afiet/core'
import { IconBook, IconChevronRight } from '../../ui/icons'
import { useActiveProfile } from '../profile/useActiveProfile'
import { AddFoodSheet } from '../nutrition/AddFoodSheet'
import { WaterCounter } from '../nutrition/WaterCounter'
import { useWaterTarget } from '../body/useWaterTarget'
import { StarterTasksCard } from '../ftue/StarterTasksCard'
import { TodayHeader } from './TodayHeader'
import { NutritionCard } from './NutritionCard'
import { BodyCard } from './BodyCard'

/** Bugün — kart panosu: Beslenme, Vücudum, Su */
export function HomePage() {
  const { id: profileId, profile } = useActiveProfile()
  const [adding, setAdding] = useState(false)
  const date = todayISO()
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)

  if (!profileId) return null

  return (
    <div className="mx-auto max-w-lg px-4 pt-5 pb-28">
      <TodayHeader profileId={profileId} profile={profile ?? undefined} />

      <div className="flex flex-col gap-3">
        {/* Kartlar art arda süzülerek girer */}
        <StarterTasksCard profileId={profileId} onAddFood={() => setAdding(true)} />
        <div className="animate-slide-fade-in" style={{ animationDelay: '40ms' }}>
          <NutritionCard
            profileId={profileId}
            profile={profile ?? undefined}
            date={date}
            onAdd={() => setAdding(true)}
          />
        </div>
        <div className="animate-slide-fade-in" style={{ animationDelay: '100ms' }}>
          <BodyCard profileId={profileId} profile={profile ?? undefined} />
        </div>
        <div className="animate-slide-fade-in" style={{ animationDelay: '160ms' }}>
          <WaterCounter profileId={profileId} date={date} target={waterTarget} />
        </div>
        <div className="animate-slide-fade-in" style={{ animationDelay: '220ms' }}>
          <Link
            to="/beslenme/besinler"
            className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-sm active:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <IconBook className="h-5.5 w-5.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                <span className="block font-bold">Besin Rehberi</span>
                <span className="block text-sm text-soft">
                  Listedeki besinleri ve yaklaşık değerlerini incele
                </span>
              </span>
            </span>
            <IconChevronRight className="h-5 w-5 shrink-0 text-faint" />
          </Link>
        </div>
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
