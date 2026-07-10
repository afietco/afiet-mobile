import { categoryMeta, type SeedFood } from '../../data/foods'
import { groupMeta, measureMeta } from '../../data/types'
import { Sheet } from '../../ui/Sheet'
import { Chip } from '../../ui/Chip'
import { GroupIcon } from '../../ui/appIcons'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

const MACRO_BOXES: {
  key: 'protein' | 'carb' | 'fat'
  label: string
  box: string
  title: string
  value: string
}[] = [
  {
    key: 'protein',
    label: 'Protein',
    box: 'bg-orange-50 dark:bg-orange-950/40',
    title: 'text-orange-600 dark:text-orange-300',
    value: 'text-orange-800 dark:text-orange-100',
  },
  {
    key: 'carb',
    label: 'Karb.',
    box: 'bg-amber-50 dark:bg-amber-950/40',
    title: 'text-amber-600 dark:text-amber-300',
    value: 'text-amber-800 dark:text-amber-100',
  },
  {
    key: 'fat',
    label: 'Yağ',
    box: 'bg-lime-50 dark:bg-lime-950/40',
    title: 'text-lime-600 dark:text-lime-300',
    value: 'text-lime-800 dark:text-lime-100',
  },
]

/** Rehberdeki bir besinin detay popup'ı — grup, ölçü, yaklaşık makrolar, kısa bilgi */
export function FoodDetailSheet({ food, onClose }: { food: SeedFood | null; onClose: () => void }) {
  return (
    <Sheet open={food !== null} onClose={onClose} title={<>{food?.name}</>}>
      {food && (
        <>
          <p className="mb-3 text-xs font-medium text-faint">{categoryMeta(food.category).label}</p>

          {food.groups.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {food.groups.map((g) => (
                <Chip
                  key={g}
                  label={groupMeta(g).label}
                  icon={<GroupIcon group={g} className="h-4.5 w-4.5" />}
                />
              ))}
            </div>
          )}

          <h3 className="mb-2 text-sm font-bold">
            1 {measureMeta(food.measure).label} için yaklaşık değerler
          </h3>
          <div className="mb-2 grid grid-cols-3 gap-2">
            {MACRO_BOXES.map((m) => (
              <div key={m.key} className={`rounded-2xl p-3 ${m.box}`}>
                <p className={`text-[10px] font-bold uppercase ${m.title}`}>{m.label}</p>
                <p className={`mt-1 text-base font-extrabold tracking-tight ${m.value}`}>
                  {num1.format(food.macros[m.key])}
                  <span className="ml-0.5 text-xs font-semibold">g</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mb-4 rounded-xl bg-violet-50 px-3.5 py-2.5 text-sm text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
            Enerji: <span className="font-bold">{num0.format(food.macros.kcal)} kcal</span>
          </p>

          <h3 className="mb-1 text-sm font-bold">Nedir?</h3>
          <p className="mb-4 text-sm leading-relaxed text-soft">{food.description}</p>

          <p className="text-xs text-faint">Değerler ev porsiyonuna göre yaklaşıktır. 💛</p>
        </>
      )}
    </Sheet>
  )
}
