import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '../../data/repositories'
import { BalanceRings } from '../nutrition/BalanceSummary'
import { dayBalance } from '../nutrition/insights'
import { CardHeader } from '../../ui/CardHeader'
import { IconBowl, IconPlus } from '../../ui/icons'

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
  const score = dayBalance(entries).score

  return (
    <section
      role="button"
      tabIndex={0}
      onClick={() => navigate('/beslenme')}
      onKeyDown={(e) => e.key === 'Enter' && navigate('/beslenme')}
      className="cursor-pointer rounded-2xl bg-surface p-4 shadow-sm transition-shadow active:shadow-md"
    >
      <CardHeader
        icon={<IconBowl className="h-5.5 w-5.5" />}
        iconBg="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
        title="Beslenme"
        chevron
        meta={
          <>
            {entries.length > 0 && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  score >= 4
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                    : score >= 2
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      : 'bg-muted text-soft'
                }`}
              >
                {score}/5
              </span>
            )}
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
          </>
        }
      />
      <BalanceRings entries={entries} message={false} />
    </section>
  )
}
