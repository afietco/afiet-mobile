import { useLiveQuery } from 'dexie-react-hooks'
import { waterRepo } from '../../data/repositories'
import { WATER_TARGET_GLASSES } from '../../data/types'
import { CardHeader } from '../../ui/CardHeader'
import { IconDrop, IconMinus, IconPlus } from '../../ui/icons'

export function WaterCounter({
  profileId,
  date,
  target = WATER_TARGET_GLASSES,
}: {
  profileId: number
  date: string
  /** Günlük bardak hedefi — Vücudum verisi varsa TDEE'den kişiselleşir */
  target?: number
}) {
  const log = useLiveQuery(() => waterRepo.forDay(profileId, date), [profileId, date])
  const glasses = log?.glasses ?? 0

  const change = (delta: number) => {
    void waterRepo.setGlasses(profileId, date, Math.max(0, glasses + delta))
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <CardHeader
        icon={<IconDrop className="h-5.5 w-5.5" />}
        iconBg="bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400"
        title="Su"
        meta={
          <span className="text-sm text-soft">
            {glasses}/{target} bardak
          </span>
        }
      />
      <div className="flex items-center gap-3">
        <button
          onClick={() => change(-1)}
          disabled={glasses === 0}
          aria-label="Bir bardak azalt"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-soft disabled:opacity-30"
        >
          <IconMinus className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <div className="flex flex-1 flex-wrap gap-1">
          {Array.from({ length: Math.max(target, glasses) }).map((_, i) => (
            <IconDrop
              key={i}
              className={`h-5.5 w-5.5 ${i < glasses ? 'text-sky-500' : 'text-faint opacity-50'}`}
            />
          ))}
        </div>
        <button
          onClick={() => change(1)}
          aria-label="Bir bardak ekle"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white active:scale-95"
        >
          <IconPlus className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </section>
  )
}
