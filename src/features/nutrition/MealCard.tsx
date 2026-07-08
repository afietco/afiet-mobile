import { mealRepo } from '../../data/repositories'
import { mealMeta, type MealEntry, type MealType } from '../../data/types'
import { GroupIcon, MealIcon } from '../../ui/appIcons'
import { IconPlus, IconX } from '../../ui/icons'

interface MealCardProps {
  meal: MealType
  entries: MealEntry[]
  onAdd: () => void
}

export function MealCard({ meal, entries, onAdd }: MealCardProps) {
  const meta = mealMeta(meal)

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <MealIcon meal={meal} className="h-5.5 w-5.5" />
          {meta.label}
        </h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white active:scale-95"
        >
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Ekle
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">Henüz kayıt yok</p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {entries.map((e) => (
            <li key={e.id} className="animate-slide-fade-in flex items-center justify-between gap-2 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-medium">{e.foodName}</p>
                {e.groups.length > 0 && (
                  <span className="flex shrink-0 items-center gap-1">
                    {e.groups.map((g) => (
                      <GroupIcon key={g} group={g} className="h-4 w-4" />
                    ))}
                  </span>
                )}
              </div>
              <button
                onClick={() => void mealRepo.remove(e.id!)}
                aria-label={`${e.foodName} kaydını sil`}
                className="shrink-0 rounded-full px-2 py-1 text-slate-300 hover:text-red-400"
              >
                <IconX className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
