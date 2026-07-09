import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { FOOD_CATEGORIES, SEED_FOODS, type SeedFood } from '../../data/foods'
import { GroupIcon } from '../../ui/appIcons'
import { IconBook, IconChevronRight } from '../../ui/icons'
import { FoodDetailSheet } from './FoodDetailSheet'

const trLower = (s: string) => s.toLocaleLowerCase('tr-TR')

/** Besin rehberi — seed listesinin kategori kategori gezilebilir hali */
export function FoodsPage() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<SeedFood | null>(null)

  const sections = useMemo(() => {
    const q = trLower(query.trim())
    const filtered = q ? SEED_FOODS.filter((f) => trLower(f.name).includes(q)) : SEED_FOODS
    return FOOD_CATEGORIES.map((c) => ({
      ...c,
      foods: filtered.filter((f) => f.category === c.key),
    })).filter((c) => c.foods.length > 0)
  }, [query])

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
            <IconBook className="h-6.5 w-6.5 text-emerald-600 dark:text-emerald-400" />
            Besin Rehberi
          </h1>
          <p className="text-sm text-soft">Listedeki besinler ve yaklaşık değerleri</p>
        </div>
      </header>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Besin ara…"
        className="mb-4 w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-emerald-500"
      />

      {sections.length === 0 && (
        <p className="py-8 text-center text-sm text-faint">Aramanla eşleşen besin yok.</p>
      )}

      <div className="flex flex-col gap-4">
        {sections.map((c) => (
          <section key={c.key}>
            <h2 className="mb-2 px-1 text-sm font-bold text-soft">{c.label}</h2>
            <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
              <ul className="divide-y divide-line/40">
                {c.foods.map((f) => (
                  <li key={f.name}>
                    <button
                      onClick={() => setSelected(f)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left active:bg-muted"
                    >
                      <span className="min-w-0 truncate font-medium">{f.name}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {f.groups.map((g) => (
                          <GroupIcon key={g} group={g} className="h-4 w-4" />
                        ))}
                        <IconChevronRight className="h-4 w-4 text-faint" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <FoodDetailSheet food={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
