import { measurementRepo } from '../../data/repositories'
import type { Measurement } from '../../data/types'
import { formatShortTR, relativeDayLabel } from '../../lib/dates'
import { IconX } from '../../ui/icons'
import { formatKg, formatNumber } from './bodyMetrics'

/** Ölçüm geçmişi — tarihe göre azalan liste */
export function MeasurementHistory({ measurements }: { measurements: Measurement[] }) {
  if (measurements.length === 0) return null
  const desc = [...measurements].reverse()

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <h2 className="mb-1 font-bold">Ölçüm Geçmişi</h2>
      <ul className="divide-y divide-line/40">
        {desc.map((m) => (
          <li key={m.id} className="animate-slide-fade-in flex items-center justify-between gap-2 py-2.5">
            <div className="min-w-0">
              <p className="font-medium">{relativeDayLabel(m.date) ?? formatShortTR(m.date)}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-soft">
                <span className="font-semibold text-ink">{formatKg(m.weightKg)}</span>
                {m.waistCm != null && <span>Bel {formatNumber(m.waistCm)}</span>}
                {m.neckCm != null && <span>Boyun {formatNumber(m.neckCm)}</span>}
                {m.hipCm != null && <span>Kalça {formatNumber(m.hipCm)}</span>}
              </p>
            </div>
            <button
              onClick={() => void measurementRepo.remove(m.id!)}
              aria-label={`${formatShortTR(m.date)} ölçümünü sil`}
              className="shrink-0 rounded-full px-2 py-1 text-faint hover:text-red-400"
            >
              <IconX className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
