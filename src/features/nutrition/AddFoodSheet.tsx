import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { foodRepo, mealRepo } from '../../data/repositories'
import {
  FOOD_GROUPS,
  FOOD_MEASURES,
  MEAL_TYPES,
  mealMeta,
  measureMeta,
  type FoodGroup,
  type FoodMeasure,
  type MealType,
} from '../../data/types'
import { searchSeedFoods, SEED_FOODS } from '../../data/foods'
import { Sheet } from '../../ui/Sheet'
import { Chip } from '../../ui/Chip'
import { GroupIcon, MealIcon } from '../../ui/appIcons'
import { IconMinus, IconPlus } from '../../ui/icons'
import { FirstLogCelebration } from '../ftue/FirstLogCelebration'
import { ftueSeen, markFtueSeen } from '../ftue/ftueFlags'
import { turkishLower } from '../../lib/turkish'

interface AddFoodSheetProps {
  profileId: number
  date: string
  open: boolean
  /** Önceden seçili öğün; null → sheet içinde öğün seçici gösterilir */
  meal: MealType | null
  onClose: () => void
}

const numQty = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const QTY_STEP = 0.5
const QTY_MIN = 0.5
const QTY_MAX = 12

/** Saate göre makul öğün varsayımı — dashboard'dan eklerken önseçim */
function guessMealByTime(): MealType {
  const h = new Date().getHours()
  if (h >= 5 && h < 11) return 'kahvalti'
  if (h >= 11 && h < 15) return 'ogle'
  if (h >= 15 && h < 17) return 'ara'
  if (h >= 17 && h < 22) return 'aksam'
  return 'ara'
}

export function AddFoodSheet({ profileId, date, open, meal, onClose }: AddFoodSheetProps) {
  const [name, setName] = useState('')
  const [groups, setGroups] = useState<FoodGroup[]>([])
  const [measure, setMeasure] = useState<FoodMeasure>('porsiyon')
  const [qty, setQty] = useState(1)
  const [autoMatched, setAutoMatched] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const [touched, setTouched] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealType>('kahvalti')
  // İlk besin kaydı kutlaması — kaydedilen besin adıyla bir kez açılır
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Açılışta öğünü belirle: önseçili öğün ya da saate göre tahmin
  useEffect(() => {
    if (open) setSelectedMeal(meal ?? guessMealByTime())
  }, [open, meal])

  const customFoods = useLiveQuery(() => foodRepo.customFoods(), []) ?? []

  // Bu öğüne bugüne kadar eklenmiş besinler — sheet üstünde gösterilir
  const mealEntries =
    useLiveQuery(
      () =>
        open
          ? mealRepo.forDay(profileId, date).then((es) => es.filter((e) => e.meal === selectedMeal))
          : Promise.resolve([]),
      [profileId, date, open, selectedMeal],
    ) ?? []

  const suggestions = useMemo(() => {
    const q = turkishLower(name.trim())
    if (!q) return []
    const custom = customFoods
      .filter((f) => turkishLower(f.name).includes(q))
      .map((f) => ({ name: f.name, groups: f.groups, measure: f.measure }))
    const seed = searchSeedFoods(name, 6)
    const seen = new Set<string>()
    return [...custom, ...seed]
      .filter((f) => {
        const key = turkishLower(f.name)
        if (seen.has(key) || key === q) return false
        seen.add(key)
        return true
      })
      .slice(0, 6)
  }, [name, customFoods])

  const pickSuggestion = (s: { name: string; groups: FoodGroup[]; measure?: FoodMeasure }) => {
    setName(s.name)
    setGroups(s.groups)
    setMeasure(s.measure ?? 'porsiyon')
    setAutoMatched(true)
    setShowAllGroups(false)
    setTouched(false)
  }

  const onNameChange = (value: string) => {
    setName(value)
    setTouched(true)
    setShowAllGroups(false)
    // Tam eşleşme varsa grupları ve ölçüyü otomatik doldur
    const exact =
      SEED_FOODS.find((f) => turkishLower(f.name) === turkishLower(value.trim())) ??
      customFoods.find((f) => turkishLower(f.name) === turkishLower(value.trim()))
    if (exact) {
      setGroups(exact.groups)
      setMeasure(exact.measure ?? 'porsiyon')
      setAutoMatched(true)
    } else {
      setGroups([])
      setMeasure('porsiyon')
      setAutoMatched(false)
    }
  }

  const toggleGroup = (g: FoodGroup) => {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  const resetFood = () => {
    setName('')
    setGroups([])
    setMeasure('porsiyon')
    setQty(1)
    setAutoMatched(false)
    setShowAllGroups(false)
    setTouched(false)
  }

  const saveEntry = async () => {
    const trimmed = name.trim()
    if (!trimmed) return false
    // Kutlama yalnızca gerçekten ilk kayıtta — eski verisi olan kurulumda atlanır
    const firstEver =
      !ftueSeen('firstMealCelebrated') && (await mealRepo.loggedDates(profileId)).length === 0
    await mealRepo.add({
      profileId,
      date,
      meal: selectedMeal,
      foodName: trimmed,
      quantity: qty,
      measure,
      groups,
      createdAt: new Date().toISOString(),
    })
    await foodRepo.learn(trimmed, groups, measure)
    if (!ftueSeen('firstMealCelebrated')) {
      markFtueSeen('firstMealCelebrated')
      if (firstEver) setCelebrating(trimmed)
    }
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
    <>
    <Sheet
      open={open}
      onClose={() => {
        resetFood()
        onClose()
      }}
      title={
        <>
          <MealIcon meal={selectedMeal} className="h-5.5 w-5.5" />
          {meal ? `${mealMeta(meal).label} — Besin Ekle` : 'Besin Ekle'}
        </>
      }
    >
      {meal === null && (
        <div className="mb-4 flex flex-wrap gap-2">
          {MEAL_TYPES.map((m) => (
            <Chip
              key={m.key}
              label={m.label}
              icon={<MealIcon meal={m.key} className="h-4.5 w-4.5" />}
              active={selectedMeal === m.key}
              onClick={() => setSelectedMeal(m.key)}
            />
          ))}
        </div>
      )}

      {mealEntries.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5 rounded-2xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/60">
          {mealEntries.map((e) => (
            <span
              key={e.id}
              className="animate-pop-in inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-sm text-emerald-800 shadow-sm dark:text-emerald-200"
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
          className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-emerald-500"
          autoFocus
        />
        {suggestionsOpen && (
          <div className="animate-slide-fade-in absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s.name}
                onClick={() => pickSuggestion(s)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
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
            <p className="text-sm font-medium text-soft">
              {autoMatched && !showAllGroups ? 'Besin grubu' : 'Besin grubu seç'}
            </p>
            {autoMatched && !showAllGroups && (
              <button
                onClick={() => setShowAllGroups(true)}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400"
              >
                Düzenle
              </button>
            )}
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
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

          {(!autoMatched || showAllGroups) && (
            <>
              <p className="mb-2 text-sm font-medium text-soft">Ölçü seç</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {FOOD_MEASURES.map((m) => (
                  <Chip
                    key={m.key}
                    label={m.label}
                    active={measure === m.key}
                    onClick={() => setMeasure(m.key)}
                  />
                ))}
              </div>
            </>
          )}

          <p className="mb-2 text-sm font-medium text-soft">{measureMeta(measure).ask}</p>
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setQty((q) => Math.max(QTY_MIN, q - QTY_STEP))}
              disabled={qty <= QTY_MIN}
              aria-label="Miktarı azalt"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-soft active:scale-95 disabled:opacity-40"
            >
              <IconMinus className="h-5 w-5" strokeWidth={2.4} />
            </button>
            <span className="min-w-24 text-center text-lg font-bold">
              {numQty.format(qty)}{' '}
              <span className="text-sm font-semibold text-soft">{measureMeta(measure).label}</span>
            </span>
            <button
              onClick={() => setQty((q) => Math.min(QTY_MAX, q + QTY_STEP))}
              disabled={qty >= QTY_MAX}
              aria-label="Miktarı artır"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-soft active:scale-95 disabled:opacity-40"
            >
              <IconPlus className="h-5 w-5" strokeWidth={2.4} />
            </button>
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
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-emerald-600 bg-surface py-3.5 font-semibold text-emerald-700 dark:text-emerald-400 dark:border-emerald-500 active:scale-[0.98] disabled:opacity-40"
        >
          <IconPlus className="h-4.5 w-4.5" strokeWidth={2.4} />
          Bir Besin Daha
        </button>
      </div>
    </Sheet>

    {celebrating !== null && (
      <FirstLogCelebration foodName={celebrating} onClose={() => setCelebrating(null)} />
    )}
    </>
  )
}
