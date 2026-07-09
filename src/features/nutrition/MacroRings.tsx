import type { FC } from 'react'
import type { MealEntry } from '../../data/types'
import { macroTargetGrams } from '../body/bodyMetrics'
import { IconEgg, IconFlame, IconOlive, IconWheat, type IconProps } from '../../ui/icons'
import { FALLBACK_TDEE, dayMacros, type DayMacros } from './macros'

const RINGS: {
  key: keyof Pick<DayMacros, 'kcal' | 'protein' | 'carb' | 'fat'>
  label: string
  Icon: FC<IconProps>
  color: string
}[] = [
  { key: 'kcal', label: 'Enerji', Icon: IconFlame, color: 'text-violet-500 dark:text-violet-400' },
  { key: 'protein', label: 'Protein', Icon: IconEgg, color: 'text-orange-400 dark:text-orange-400' },
  { key: 'carb', label: 'Karb.', Icon: IconWheat, color: 'text-amber-400 dark:text-amber-400' },
  { key: 'fat', label: 'Yağ', Icon: IconOlive, color: 'text-lime-500 dark:text-lime-400' },
]

function Ring({ pct, color, Icon }: { pct: number; color: string; Icon: FC<IconProps> }) {
  const r = 15.5
  const c = 2 * Math.PI * r
  const filled = (Math.min(100, pct) / 100) * c
  return (
    <div className={`relative h-12 w-12 ${color}`}>
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" strokeWidth="2.6" className="stroke-muted" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="2.6"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={`${filled} ${c}`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <Icon className="absolute top-1/2 left-1/2 h-5.5 w-5.5 -translate-x-1/2 -translate-y-1/2" />
    </div>
  )
}

/**
 * 4 makro halkası (enerji + protein/karb/yağ) — Bugün kartındaki kompakt
 * özet. Hedefler TDEE'den; yoksa genel referansla, doluluk %100'de durur.
 */
export function MacroRings({
  entries,
  tdeeValue,
}: {
  entries: MealEntry[]
  tdeeValue: number | null
}) {
  const totals = dayMacros(entries)
  const target = tdeeValue ?? FALLBACK_TDEE

  return (
    <div className="flex justify-between gap-1">
      {RINGS.map((ring) => {
        const max = ring.key === 'kcal' ? target : macroTargetGrams(target, ring.key)
        const pct = (totals[ring.key] / max) * 100
        return (
          <div key={ring.key} className="flex flex-1 flex-col items-center gap-1">
            <Ring pct={pct} color={ring.color} Icon={ring.Icon} />
            <span className={`text-[10px] ${pct > 0 ? `font-medium ${ring.color}` : 'text-faint'}`}>
              {ring.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
