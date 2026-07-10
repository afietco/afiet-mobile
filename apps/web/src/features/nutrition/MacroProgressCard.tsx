import { Link } from 'react-router'
import type { MealEntry } from '@afiet/core'
import { macroTargetGrams, type MacroKey } from '@afiet/core'
import { IconFlame } from '../../ui/icons'
import { FALLBACK_TDEE, dayMacros } from '@afiet/core'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

const MACRO_BARS: { key: MacroKey; label: string; fill: string }[] = [
  { key: 'protein', label: 'Protein', fill: 'bg-orange-400 dark:bg-orange-500' },
  { key: 'carb', label: 'Karbonhidrat', fill: 'bg-amber-400 dark:bg-amber-500' },
  { key: 'fat', label: 'Yağ', fill: 'bg-lime-500 dark:bg-lime-600' },
]

function Bar({ value, max, fill, tall = false }: { value: number; max: number; fill: string; tall?: boolean }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className={`overflow-hidden rounded-full bg-muted ${tall ? 'h-3' : 'h-2'}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${fill}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/**
 * Günün yaklaşık enerji ve makro ilerlemesi — hedefler kişinin TDEE'sinden
 * türetilir. Katı takip değil pusula: bar %100'de durur, ton yargılamaz.
 */
export function MacroProgressCard({
  entries,
  tdeeValue,
}: {
  entries: MealEntry[]
  tdeeValue: number | null
}) {
  const totals = dayMacros(entries)
  const target = tdeeValue ?? FALLBACK_TDEE

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <IconFlame className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          Enerji &amp; Makrolar
        </h2>
        <span className="text-sm font-bold text-violet-700 dark:text-violet-300">
          {num0.format(Math.round(totals.kcal))}
          <span className="font-medium text-faint"> / {num0.format(Math.round(target))} kcal</span>
        </span>
      </div>
      <Bar value={totals.kcal} max={target} fill="bg-violet-500 dark:bg-violet-500" tall />

      <div className="mt-3 flex flex-col gap-2.5">
        {MACRO_BARS.map((m) => {
          const targetG = macroTargetGrams(target, m.key)
          return (
            <div key={m.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-soft">{m.label}</span>
                <span className="text-faint">
                  <span className="font-semibold text-ink">{num0.format(Math.round(totals[m.key]))}</span>
                  {' / '}
                  {num0.format(Math.round(targetG))} g
                </span>
              </div>
              <Bar value={totals[m.key]} max={targetG} fill={m.fill} />
            </div>
          )
        })}
      </div>

      {tdeeValue == null && (
        <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
          Genel bir referansla gösteriliyor.{' '}
          <Link to="/vucudum" className="font-semibold underline">
            Vücudum
          </Link>{' '}
          bilgilerini tamamlarsan hedefler sana göre hesaplanır.
        </p>
      )}
      {totals.unknownCount > 0 && (
        <p className="mt-2 text-[11px] text-faint">
          {totals.unknownCount} kayıt listede olmadığı için hesaba katılamadı.
        </p>
      )}
      <p className="mt-2 text-[11px] text-faint">Değerler yaklaşıktır — pusula niyetine, gram gram saymıyoruz. 💛</p>
    </section>
  )
}
