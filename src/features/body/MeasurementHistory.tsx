import { measurementRepo } from '../../data/repositories'
import type { Measurement } from '../../data/types'
import { formatShortTR, fromISO, relativeDayLabel } from '../../lib/dates'
import { IconX } from '../../ui/icons'
import { formatNumber } from './bodyMetrics'

const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short' })

function GirthChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-soft shadow-sm">
      {label} {formatNumber(value)}
    </span>
  )
}

/** Ölçüm geçmişi — tarihe göre azalan liste (sheet içeriği) */
export function MeasurementHistory({ measurements }: { measurements: Measurement[] }) {
  if (measurements.length === 0)
    return <p className="py-4 text-center text-sm text-faint">Henüz ölçüm yok</p>
  const desc = [...measurements].reverse()

  return (
    <ul className="flex flex-col gap-2">
      {desc.map((m, i) => {
        const older = desc[i + 1]
        const diff = older ? m.weightKg - older.weightKg : null
        const d = fromISO(m.date)
        const hasGirths = m.waistCm != null || m.neckCm != null || m.hipCm != null
        return (
          <li
            key={m.id}
            className="animate-slide-fade-in flex items-center gap-3 rounded-2xl bg-muted/60 p-3"
          >
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-surface shadow-sm">
              <span className="text-sm leading-none font-extrabold">{dayFmt.format(d)}</span>
              <span className="mt-0.5 text-[10px] leading-none text-faint">{monthFmt.format(d)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-extrabold">
                  {formatNumber(m.weightKg)} <span className="text-xs font-semibold text-soft">kg</span>
                </span>
                {diff !== null && Math.abs(diff) >= 0.05 && (
                  <span className="text-xs font-medium text-soft">
                    {diff < 0 ? '↓' : '↑'} {formatNumber(Math.abs(diff))}
                  </span>
                )}
                {relativeDayLabel(m.date) && (
                  <span className="text-xs text-faint">{relativeDayLabel(m.date)}</span>
                )}
              </p>
              {hasGirths && (
                <p className="mt-1 flex flex-wrap gap-1">
                  {m.waistCm != null && <GirthChip label="Bel" value={m.waistCm} />}
                  {m.neckCm != null && <GirthChip label="Boyun" value={m.neckCm} />}
                  {m.hipCm != null && <GirthChip label="Kalça" value={m.hipCm} />}
                </p>
              )}
            </div>
            <button
              onClick={() => void measurementRepo.remove(m.id!)}
              aria-label={`${formatShortTR(m.date)} ölçümünü sil`}
              className="shrink-0 rounded-full px-2 py-1 text-faint hover:text-red-400"
            >
              <IconX className="h-4 w-4" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}
