import { FOOD_GROUPS, type MealEntry } from '../../data/types'
import { GroupIcon } from '../../ui/appIcons'
import { dayBalance, dayMessage } from './insights'

export function BalanceSummary({ entries }: { entries: MealEntry[] }) {
  const balance = dayBalance(entries)
  const coreGroups = FOOD_GROUPS.filter((g) => g.core)

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">Günlük Denge</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            balance.score >= 4
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
              : balance.score >= 2
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                : 'bg-muted text-soft'
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
                className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 ${
                  covered ? 'scale-105 bg-emerald-100 ring-2 ring-emerald-400 dark:bg-emerald-900/50 dark:ring-emerald-500' : 'bg-muted opacity-40'
                }`}
              >
                <GroupIcon group={g.key} className="h-6 w-6" />
              </div>
              <span className={`text-[10px] ${covered ? 'text-emerald-700 font-medium dark:text-emerald-300' : 'text-faint'}`}>
                {g.label}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-sm text-soft">{dayMessage(balance, entries.length)}</p>
    </section>
  )
}
