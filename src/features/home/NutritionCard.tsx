import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '../../data/repositories'
import { BalanceRings } from '../nutrition/BalanceSummary'
import { IconBowl, IconChevronRight, IconPlus } from '../../ui/icons'

/** Dashboard Beslenme kartı — denge özeti; + ile doğrudan besin ekleme */
export function NutritionCard({
  profileId,
  date,
  onAdd,
}: {
  profileId: number
  date: string
  onAdd: () => void
}) {
  const navigate = useNavigate()
  const entries =
    useLiveQuery(() => mealRepo.forDay(profileId, date), [profileId, date]) ?? []

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={() => navigate('/beslenme')}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/beslenme')}
      className="cursor-pointer rounded-2xl bg-surface p-4 shadow-sm transition-shadow active:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <IconBowl className="h-5.5 w-5.5 text-emerald-600 dark:text-emerald-400" />
          Beslenme
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            aria-label="Besin ekle"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white active:scale-95"
          >
            <IconPlus className="h-4.5 w-4.5" strokeWidth={2.4} />
          </button>
          <IconChevronRight className="h-5 w-5 text-faint" />
        </div>
      </div>
      <BalanceRings entries={entries} />
    </section>
  )
}
