import { useLiveQuery } from 'dexie-react-hooks'
import { waterRepo } from '../../data/repositories'
import { WATER_TARGET_GLASSES } from '../../data/types'

export function WaterCounter({ profileId, date }: { profileId: number; date: string }) {
  const log = useLiveQuery(() => waterRepo.forDay(profileId, date), [profileId, date])
  const glasses = log?.glasses ?? 0

  const change = (delta: number) => {
    void waterRepo.setGlasses(profileId, date, Math.max(0, glasses + delta))
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-bold">Su 💧</h2>
        <span className="text-sm text-slate-500">
          {glasses}/{WATER_TARGET_GLASSES} bardak
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => change(-1)}
          disabled={glasses === 0}
          aria-label="Bir bardak azalt"
          className="h-11 w-11 rounded-full bg-slate-100 text-xl font-bold text-slate-600 disabled:opacity-30"
        >
          −
        </button>
        <div className="flex flex-1 flex-wrap gap-1">
          {Array.from({ length: Math.max(WATER_TARGET_GLASSES, glasses) }).map((_, i) => (
            <span key={i} className={`text-xl ${i < glasses ? '' : 'opacity-20'}`}>
              💧
            </span>
          ))}
        </div>
        <button
          onClick={() => change(1)}
          aria-label="Bir bardak ekle"
          className="h-11 w-11 rounded-full bg-sky-500 text-xl font-bold text-white active:scale-95"
        >
          ＋
        </button>
      </div>
    </section>
  )
}
