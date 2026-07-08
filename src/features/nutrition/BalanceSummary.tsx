import { FOOD_GROUPS, type MealEntry } from '../../data/types'
import { dayBalance, dayMessage } from './insights'

export function BalanceSummary({ entries }: { entries: MealEntry[] }) {
  const balance = dayBalance(entries)
  const coreGroups = FOOD_GROUPS.filter((g) => g.core)

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Günlük Denge</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            balance.score >= 4
              ? 'bg-emerald-100 text-emerald-700'
              : balance.score >= 2
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {balance.score}/5
        </span>
      </div>
      <div className="mb-3 flex justify-between gap-1">
        {coreGroups.map((g) => {
          const covered = balance.covered.includes(g.key)
          return (
            <div key={g.key} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full text-xl transition-colors ${
                  covered ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-slate-100 opacity-40'
                }`}
              >
                {g.emoji}
              </div>
              <span className={`text-[10px] ${covered ? 'text-emerald-700 font-medium' : 'text-slate-400'}`}>
                {g.label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-slate-500">{dayMessage(balance, entries.length)}</p>
    </section>
  )
}
