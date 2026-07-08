import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { foodRepo, mealRepo } from '../../data/repositories'
import {
  FOOD_GROUPS,
  PORTION_SIZES,
  mealMeta,
  type FoodGroup,
  type MealType,
  type PortionSize,
} from '../../data/types'
import { searchSeedFoods, SEED_FOODS } from '../../data/foods'
import { Sheet } from '../../ui/Sheet'
import { Chip } from '../../ui/Chip'

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
  const [portion, setPortion] = useState<PortionSize>('orta')
  const [quantity, setQuantity] = useState(1)
  const [touched, setTouched] = useState(false)

  const customFoods = useLiveQuery(() => foodRepo.customFoods(), []) ?? []

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
    setTouched(true)
  }

  const onNameChange = (value: string) => {
    setName(value)
    setTouched(true)
    // Tam eşleşme varsa grupları otomatik doldur
    const exact =
      SEED_FOODS.find((f) => trLower(f.name) === trLower(value.trim())) ??
      customFoods.find((f) => trLower(f.name) === trLower(value.trim()))
    if (exact) setGroups(exact.groups)
  }

  const toggleGroup = (g: FoodGroup) => {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const reset = () => {
    setName('')
    setGroups([])
    setPortion('orta')
    setQuantity(1)
    setTouched(false)
  }

  const save = async () => {
    const trimmed = name.trim()
    if (!trimmed || !meal) return
    await mealRepo.add({
      profileId,
      date,
      meal,
      foodName: trimmed,
      portionSize: portion,
      quantity,
      groups,
      createdAt: new Date().toISOString(),
    })
    await foodRepo.learn(trimmed, groups)
    reset()
    onClose()
  }

  return (
    <Sheet
      open={meal !== null}
      onClose={() => {
        reset()
        onClose()
      }}
      title={meal ? `${mealMeta(meal).emoji} ${mealMeta(meal).label} — Besin Ekle` : ''}
    >
      <div className="relative mb-4">
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ne yedin? (örn. mercimek çorbası)"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
          autoFocus
        />
        {touched && suggestions.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => pickSuggestion(s)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-emerald-50"
              >
                <span>{s.name}</span>
                <span className="text-xs">
                  {s.groups.map((g) => FOOD_GROUPS.find((fg) => fg.key === g)?.emoji).join(' ')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-2 text-sm font-medium text-slate-500">Porsiyon</p>
      <div className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 overflow-hidden rounded-xl border border-slate-200">
          {PORTION_SIZES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPortion(p.key)}
              className={`flex-1 py-2.5 text-sm font-medium ${
                portion === p.key ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-1 text-lg text-slate-500"
            aria-label="Adet azalt"
          >
            −
          </button>
          <span className="w-5 text-center font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(9, q + 1))}
            className="px-1 text-lg text-slate-500"
            aria-label="Adet artır"
          >
            ＋
          </button>
        </div>
      </div>

      <p className="mb-2 text-sm font-medium text-slate-500">
        Besin grupları <span className="font-normal">(bilinçli seçim için işaretle)</span>
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        {FOOD_GROUPS.map((g) => (
          <Chip
            key={g.key}
            label={g.label}
            emoji={g.emoji}
            active={groups.includes(g.key)}
            onClick={() => toggleGroup(g.key)}
          />
        ))}
      </div>

      <button
        onClick={save}
        disabled={!name.trim()}
        className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white active:scale-[0.98] disabled:opacity-40"
      >
        Kaydet
      </button>
    </Sheet>
  )
}
