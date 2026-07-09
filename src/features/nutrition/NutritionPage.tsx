import { useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '../../data/repositories'
import { MEAL_TYPES, type MealType } from '../../data/types'
import { formatLongTR, todayISO } from '../../lib/dates'
import { useActiveProfile } from '../profile/useActiveProfile'
import { FirstVisitIntro } from '../ftue/FirstVisitIntro'
import { IconBowl, IconChevronRight } from '../../ui/icons'
import { MealCard } from './MealCard'
import { AddFoodSheet } from './AddFoodSheet'
import { BalanceSummary } from './BalanceSummary'

export function NutritionPage() {
  const { id: profileId } = useActiveProfile()
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
            <IconBowl className="h-6.5 w-6.5 text-emerald-600 dark:text-emerald-400" />
            Beslenme
          </h1>
          <p className="text-sm text-soft">{formatLongTR(date)}</p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <FirstVisitIntro
          ftueKey="introBeslenme"
          gradient="bg-gradient-to-br from-emerald-600 to-teal-500"
          icon={<IconBowl className="h-6 w-6" />}
          title="Denge, kalori değil 🌿"
          text="Öğünlerine besin ekledikçe 5 temel grubun dengesi burada işlenir. Sayı saymak yok — tabağındaki çeşitlilik yeter."
        />
        <BalanceSummary entries={entries} />
        {MEAL_TYPES.map((m) => (
          <MealCard
            key={m.key}
            meal={m.key}
            entries={entries.filter((e) => e.meal === m.key)}
            onAdd={() => setAddingTo(m.key)}
          />
        ))}
      </div>

      <AddFoodSheet
        profileId={profileId}
        date={date}
        open={addingTo !== null}
        meal={addingTo}
        onClose={() => setAddingTo(null)}
      />
    </div>
  )
}
