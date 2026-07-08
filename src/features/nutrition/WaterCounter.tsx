import { useLiveQuery } from 'dexie-react-hooks'
import { waterRepo } from '../../data/repositories'
import { WATER_TARGET_GLASSES } from '../../data/types'
import { IconDrop, IconMinus, IconPlus } from '../../ui/icons'

export function WaterCounter({ profileId, date }: { profileId: number; date: string }) {
  const log = useLiveQuery(() => waterRepo.forDay(profileId, date), [profileId, date])
  const glasses = log?.glasses ?? 0

  const change = (delta: number) => {
    void waterRepo.setGlasses(profileId, date, Math.max(0, glasses + delta))
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold">
          <IconDrop className="h-5 w-5 text-sky-500" />
          Su
        </h2>
        <span className="text-sm text-soft">
          {glasses}/{WATER_TARGET_GLASSES} bardak
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => change(-1)}
          disabled={glasses === 0}
          aria-label="Bir bardak azalt"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-soft disabled:opacity-30"
        >
          <IconMinus className="h-5 w-5" strokeWidth={2.2} />
        </button>
        <div className="flex flex-1 flex-wrap gap-1">
          {Array.from({ length: Math.max(WATER_TARGET_GLASSES, glasses) }).map((_, i) => (
            <IconDrop
              key={i}
              className={`h-6 w-6 ${i < glasses ? 'text-sky-500' : 'text-faint opacity-50'}`}
            />
          ))}
        </div>
        <button
          onClick={() => change(1)}
          aria-label="Bir bardak ekle"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white active:scale-95"
        >
          <IconPlus className="h-5 w-5" strokeWidth={2.2} />
        </button>
      </div>
    </section>
  )
}
