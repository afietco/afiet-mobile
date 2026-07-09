import { activityMeta, type ActivityLevel } from '../../data/types'
import { Sheet } from '../../ui/Sheet'
import { IconDrop, IconFlame, IconWheat } from '../../ui/icons'
import { fiberGrams, waterGlassesFromTdee, waterMl } from './bodyMetrics'

/** Dengeli bir gün için yaygın makro aralıkları — katı hedef değil, pusula */
const MACROS = [
  { name: 'Protein', pctMin: 0.2, pctMax: 0.3, kcalPerG: 4, dot: 'bg-emerald-400' },
  { name: 'Karbonhidrat', pctMin: 0.45, pctMax: 0.55, kcalPerG: 4, dot: 'bg-amber-400' },
  { name: 'Yağ', pctMin: 0.25, pctMax: 0.35, kcalPerG: 9, dot: 'bg-sky-400' },
]

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const num2 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 })
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

/** Günlük enerji detayı — belirgin BMR/TDEE blokları ve makro pusulası */
export function EnergySheet({ bmrValue, tdeeValue, activity, open, onClose }: EnergySheetProps) {
  const act = activityMeta(activity)
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
      <div className="mb-3 grid grid-cols-2 gap-3">
        <div className="animate-pop-in rounded-2xl bg-muted p-4">
          <p className="text-xs font-bold tracking-wide text-faint uppercase">BMR</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {num0.format(Math.round(bmrValue))}
            <span className="ml-1 text-sm font-semibold text-soft">kcal</span>
          </p>
          <p className="mt-1.5 text-xs text-soft">Dinlenirken harcadığın enerji</p>
        </div>
        <div className="animate-pop-in rounded-2xl bg-violet-100 p-4 dark:bg-violet-900/40" style={{ animationDelay: '60ms' }}>
          <p className="text-xs font-bold tracking-wide text-violet-600 uppercase dark:text-violet-300">TDEE</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-violet-800 dark:text-violet-100">
            {num0.format(Math.round(tdeeValue))}
            <span className="ml-1 text-sm font-semibold text-violet-600 dark:text-violet-300">kcal</span>
          </p>
          <p className="mt-1.5 text-xs text-violet-700/80 dark:text-violet-200/80">
            Aktivitenle birlikte günlük ihtiyacın
          </p>
        </div>
      </div>

      <p className="mb-5 rounded-xl bg-muted/60 px-3.5 py-2.5 text-center text-sm text-soft">
        {num0.format(Math.round(bmrValue))} × {num2.format(act.multiplier)}
        <span className="text-xs text-faint"> ({act.label})</span> ={' '}
        <span className="font-bold text-ink">{num0.format(Math.round(tdeeValue))} kcal</span>
      </p>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="animate-slide-fade-in rounded-2xl bg-sky-50 p-4 dark:bg-sky-950/40">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-sky-600 uppercase dark:text-sky-300">
            <IconDrop className="h-4 w-4" />
            Su
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-sky-800 dark:text-sky-100">
            {num1.format(waterMl(tdeeValue) / 1000)}
            <span className="ml-1 text-sm font-semibold text-sky-600 dark:text-sky-300">L</span>
          </p>
          <p className="mt-1.5 text-xs text-sky-700/80 dark:text-sky-200/80">
            ≈ {waterGlassesFromTdee(tdeeValue)} bardak — Su kartındaki hedefin buna göre 💧
          </p>
        </div>
        <div className="animate-slide-fade-in rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/40" style={{ animationDelay: '60ms' }}>
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-600 uppercase dark:text-amber-300">
            <IconWheat className="h-4 w-4" />
            Lif
          </p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-amber-800 dark:text-amber-100">
            {num0.format(Math.round(fiberGrams(tdeeValue)))}
            <span className="ml-1 text-sm font-semibold text-amber-600 dark:text-amber-300">g</span>
          </p>
          <p className="mt-1.5 text-xs text-amber-700/80 dark:text-amber-200/80">
            Sebze, meyve ve tam tahıldan gelir 🌾
          </p>
        </div>
      </div>

      <h3 className="mb-1 font-bold">Makro pusulası</h3>
      <p className="mb-3 text-xs text-faint">Dengeli bir gün için yaygın aralıklar, senin enerjine göre:</p>
      <div className="mb-3 flex flex-col gap-1.5">
        {MACROS.map((m, i) => (
          <div
            key={m.name}
            className="animate-slide-fade-in flex items-center justify-between text-sm"
            style={{ animationDelay: `${i * 50}ms` }}
          >
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
