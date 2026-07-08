import { mealRepo } from '../../data/repositories'
import { groupMeta, mealMeta, type MealEntry, type MealType } from '../../data/types'

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
        <h2 className="font-bold">
          {meta.emoji} {meta.label}
        </h2>
        <button
          onClick={onAdd}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white active:scale-95"
        >
          ＋ Ekle
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">Henüz kayıt yok</p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-2 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-medium">{e.foodName}</p>
                {e.groups.length > 0 && (
                  <span className="shrink-0 text-xs">
                    {e.groups.map((g) => groupMeta(g).emoji).join(' ')}
                  </span>
                )}
              </div>
              <button
                onClick={() => void mealRepo.remove(e.id!)}
                aria-label={`${e.foodName} kaydını sil`}
                className="shrink-0 rounded-full px-2 py-1 text-slate-300 hover:text-red-400"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
