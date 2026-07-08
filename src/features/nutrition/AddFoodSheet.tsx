import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { foodRepo, mealRepo } from '../../data/repositories'
import { FOOD_GROUPS, mealMeta, type FoodGroup, type MealType } from '../../data/types'
import { searchSeedFoods, SEED_FOODS } from '../../data/foods'
import { Sheet } from '../../ui/Sheet'
import { Chip } from '../../ui/Chip'
import { GroupIcon, MealIcon } from '../../ui/appIcons'
import { IconPlus } from '../../ui/icons'

interface AddFoodSheetProps {
  profileId: number
  date: string
  meal: MealType | null
  onClose: () => void
}

const trLower = (s: string) => s.toLocaleLowerCase('tr-TR')

export function AddFoodSheet({ profileId, date, meal, onClose }: AddFoodSheetProps) {
  const [name, setName] = useState('')
  const [groups, setGroups] = useState<FoodGroup[]>([])
  const [autoMatched, setAutoMatched] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [touched, setTouched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const customFoods = useLiveQuery(() => foodRepo.customFoods(), []) ?? []

  // Bu öğüne bugüne kadar eklenmiş besinler — sheet üstünde gösterilir
  const mealEntries =
    useLiveQuery(
      () =>
        meal ? mealRepo.forDay(profileId, date).then((es) => es.filter((e) => e.meal === meal)) : Promise.resolve([]),
      [profileId, date, meal],
    ) ?? []

  const suggestions = useMemo(() => {
    const q = trLower(name.trim())
    if (!q) return []
    const custom = customFoods
      .filter((f) => trLower(f.name).includes(q))
      .map((f) => ({ name: f.name, groups: f.groups }))
    const seed = searchSeedFoods(name, 6)
    const seen = new Set<string>()
    return [...custom, ...seed]
      .filter((f) => {
        const key = trLower(f.name)
        if (seen.has(key) || key === q) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
  }, [name, customFoods])

  const pickSuggestion = (s: { name: string; groups: FoodGroup[] }) => {
    setName(s.name)
    setGroups(s.groups)
    setAutoMatched(true)
    setShowAllGroups(false)
    setTouched(false)
  }

  const onNameChange = (value: string) => {
    setName(value)
    setTouched(true)
    setShowAllGroups(false)
    // Tam eşleşme varsa grupları otomatik doldur
    const exact =
      SEED_FOODS.find((f) => trLower(f.name) === trLower(value.trim())) ??
      customFoods.find((f) => trLower(f.name) === trLower(value.trim()))
    if (exact) {
      setGroups(exact.groups)
      setAutoMatched(true)
    } else {
      setGroups([])
      setAutoMatched(false)
    }
  }

  const toggleGroup = (g: FoodGroup) => {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const resetFood = () => {
    setName('')
    setGroups([])
    setAutoMatched(false)
    setShowAllGroups(false)
    setTouched(false)
  }

  const saveEntry = async () => {
    const trimmed = name.trim()
    if (!trimmed || !meal) return false
    await mealRepo.add({
      profileId,
      date,
      meal,
      foodName: trimmed,
      portionSize: 'orta',
      quantity: 1,
      groups,
      createdAt: new Date().toISOString(),
    })
    await foodRepo.learn(trimmed, groups)
    return true
  }

  const save = async () => {
    if (await saveEntry()) {
      resetFood()
      onClose()
    }
  }

  const saveAndNext = async () => {
    if (await saveEntry()) {
      resetFood()
      inputRef.current?.focus()
    }
  }

  const hasName = name.trim().length > 0
  const suggestionsOpen = touched && suggestions.length > 0
  // Gruplar yalnızca besin netleşince görünür: öneri listesi açıkken gizli
  const showGroupSection = hasName && !suggestionsOpen
  // Eşleşen besinde yalnızca ilişkili gruplar; bilinmeyen besinde (veya "düzenle" ile) tümü
  const visibleGroups =
    autoMatched && !showAllGroups ? FOOD_GROUPS.filter((g) => groups.includes(g.key)) : FOOD_GROUPS

  return (
    <Sheet
      open={meal !== null}
      onClose={() => {
        resetFood()
        onClose()
      }}
      title={
        meal ? (
          <>
            <MealIcon meal={meal} className="h-5.5 w-5.5" />
            {mealMeta(meal).label} — Besin Ekle
          </>
        ) : (
          ''
        )
      }
    >
      {mealEntries.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5 rounded-2xl bg-emerald-50 px-3 py-2.5">
          {mealEntries.map((e) => (
            <span
              key={e.id}
              className="animate-pop-in inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-sm text-emerald-800 shadow-sm"
            >
              {e.foodName}
              {e.groups.length > 0 && (
                <span className="flex items-center gap-0.5">
                  {e.groups.map((g) => (
                    <GroupIcon key={g} group={g} className="h-3.5 w-3.5" />
                  ))}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="relative mb-4">
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ne yedin? (örn. mercimek çorbası)"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          autoFocus
        />
        {suggestionsOpen && (
          <div className="animate-slide-fade-in absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => pickSuggestion(s)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-emerald-50"
              >
                <span>{s.name}</span>
                <span className="flex items-center gap-1">
                  {s.groups.map((g) => (
                    <GroupIcon key={g} group={g} className="h-4 w-4" />
                  ))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showGroupSection && (
        <div className="animate-slide-fade-in">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              {autoMatched && !showAllGroups ? 'Besin grubu' : 'Besin grubu seç'}
            </p>
            {autoMatched && !showAllGroups && (
              <button
                onClick={() => setShowAllGroups(true)}
                className="text-xs font-medium text-emerald-600"
              >
                Düzenle
              </button>
            )}
          </div>
          <div className="mb-6 flex flex-wrap gap-2">
            {visibleGroups.map((g) => (
              <Chip
                key={g.key}
                label={g.label}
                icon={<GroupIcon group={g.key} className="h-4.5 w-4.5" />}
                active={groups.includes(g.key)}
                onClick={
                  autoMatched && !showAllGroups ? undefined : () => toggleGroup(g.key)
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={!hasName}
          className="flex-1 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
        >
          Kaydet
        </button>
        <button
          onClick={saveAndNext}
          disabled={!hasName}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-600 bg-white py-3.5 font-semibold text-emerald-700 active:scale-[0.98] disabled:opacity-40"
        >
          <IconPlus className="h-4.5 w-4.5" strokeWidth={2.4} />
          Bir Besin Daha
        </button>
      </div>
    </Sheet>
  )
}
