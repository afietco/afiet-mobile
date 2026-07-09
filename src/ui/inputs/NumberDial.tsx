import { formatDecimalTR, parseDecimal } from '../../lib/numbers'
import { IconMinus, IconPlus } from '../icons'

interface NumberDialProps {
  /** Ham metin — virgül toleranslı, elle de yazılabilir */
  value: string
  onChange: (v: string) => void
  unit: string
  min: number
  max: number
  step?: number
  /** Boşken ± basılınca başlanacak değer */
  fallback: number
  ariaLabel: string
}

/** Custom sayı girişi — ortada büyük değer, iki yanda ± adımlayıcı */
export function NumberDial({
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  fallback,
  ariaLabel,
}: NumberDialProps) {
  const num = parseDecimal(value)

  const nudge = (dir: 1 | -1) => {
    const base = num ?? fallback
    const next = Math.min(max, Math.max(min, Math.round((base + dir * step) * 10) / 10))
    onChange(formatDecimalTR(next))
  }

  const btn =
    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-soft transition-transform active:scale-90'

  return (
    <div className="flex items-center gap-2 rounded-3xl bg-surface p-4 shadow-sm">
      <button type="button" aria-label="Azalt" onClick={() => nudge(-1)} className={btn}>
        <IconMinus className="h-6 w-6" strokeWidth={2.4} />
      </button>
      <div className="min-w-0 flex-1 text-center">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={formatDecimalTR(fallback)}
          aria-label={ariaLabel}
          className="w-full bg-transparent text-center text-5xl font-extrabold tracking-tight outline-none placeholder:text-line"
        />
        <span className="text-sm font-semibold text-faint">{unit}</span>
      </div>
      <button type="button" aria-label="Artır" onClick={() => nudge(1)} className={btn}>
        <IconPlus className="h-6 w-6" strokeWidth={2.4} />
      </button>
    </div>
  )
}
