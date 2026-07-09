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
  // Hiç kayıt yoksa (yeni kullanıcı) kart ilk görev davetine dönüşür;
  // sorgu dolana kadar davet gösterilmez (mevcut kullanıcıda flash olmasın)
  const loggedDates = useLiveQuery(() => mealRepo.loggedDates(profileId), [profileId])
  const neverLogged = loggedDates !== undefined && loggedDates.length === 0

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
            <span className="relative">
              {neverLogged && (
                <span
                  className="absolute inset-0 animate-ping rounded-full bg-emerald-500/50 motion-reduce:hidden"
                  aria-hidden
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                aria-label="Besin ekle"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white active:scale-95"
              >
                <IconPlus className="h-4.5 w-4.5" strokeWidth={2.4} />
              </button>
            </span>
          </>
        }
      />
      {neverLogged ? (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-4 text-white">
          <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/15 blur-xl" />
          <p className="relative font-extrabold">İlk öğününü ekle 🍽️</p>
          <p className="relative mt-0.5 text-sm text-emerald-50/90">
            Denge skorun ilk kayıtla işlemeye başlar — kalori yok, denge var.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="relative mt-3 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold ring-1 ring-white/30 backdrop-blur-sm active:scale-95"
          >
            Besin Ekle
          </button>
        </div>
      ) : (
        <BalanceRings entries={entries} message={false} />
      )}
    </section>
  )
}
