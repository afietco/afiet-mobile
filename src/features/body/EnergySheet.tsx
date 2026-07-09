import { activityMeta, type ActivityLevel } from '../../data/types'
import { Sheet } from '../../ui/Sheet'
import { IconFlame } from '../../ui/icons'
import { formatKcal } from './bodyMetrics'

/** Dengeli bir gün için yaygın makro aralıkları — katı hedef değil, pusula */
const MACROS = [
  { name: 'Protein', pctMin: 0.2, pctMax: 0.3, kcalPerG: 4, dot: 'bg-emerald-400' },
  { name: 'Karbonhidrat', pctMin: 0.45, pctMax: 0.55, kcalPerG: 4, dot: 'bg-amber-400' },
  { name: 'Yağ', pctMin: 0.25, pctMax: 0.35, kcalPerG: 9, dot: 'bg-sky-400' },
]

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
/** 5 grama yuvarlanmış aralık — sahte hassasiyet vermemek için */
const grams = (kcal: number, pct: number, kcalPerG: number) =>
  num0.format(Math.round((kcal * pct) / kcalPerG / 5) * 5)

interface EnergySheetProps {
  bmrValue: number
  tdeeValue: number
  activity: ActivityLevel
  open: boolean
  onClose: () => void
}

/** Günlük enerji detayı — BMR/TDEE açıklaması ve makro pusulası */
export function EnergySheet({ bmrValue, tdeeValue, activity, open, onClose }: EnergySheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <>
          <IconFlame className="h-5.5 w-5.5 text-violet-600 dark:text-violet-400" />
          Günlük Enerji
        </>
      }
    >
      <div className="mb-4 rounded-2xl bg-muted p-4">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-extrabold tracking-tight">{formatKcal(tdeeValue)}</p>
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            {activityMeta(activity).label}
          </span>
        </div>
        <p className="mt-1 text-xs text-soft">Dinlenme (BMR): {formatKcal(bmrValue)}</p>
      </div>

      <p className="mb-4 text-sm text-soft">
        BMR, vücudunun dinlenirken harcadığı enerjidir (Mifflin-St Jeor tahmini). Günlük
        enerji (TDEE) buna aktivite temposunu ekler. Bu bir hedef değil, porsiyonlarını
        tanımana yardım eden bir pusula — günden güne değişmesi çok doğal. 🌿
      </p>

      <h3 className="mb-1 font-bold">Makro pusulası</h3>
      <p className="mb-3 text-xs text-faint">
        Dengeli bir gün için yaygın dağılım aralıkları, senin enerjine göre:
      </p>
      <div className="mb-2 flex flex-col gap-1.5">
        {MACROS.map((m) => (
          <div key={m.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
              {m.name}
              <span className="text-xs text-faint">
                %{num0.format(m.pctMin * 100)}–{num0.format(m.pctMax * 100)}
              </span>
            </span>
            <span className="font-semibold text-soft">
              {grams(tdeeValue, m.pctMin, m.kcalPerG)}–{grams(tdeeValue, m.pctMax, m.kcalPerG)} g
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-faint">Sadece bilgi amaçlı — kalori saymıyoruz. 💛</p>
    </Sheet>
  )
}
