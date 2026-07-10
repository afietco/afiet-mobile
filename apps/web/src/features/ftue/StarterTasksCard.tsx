import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo, measurementRepo, waterRepo } from '../../data/repositories'
import { todayISO } from '@afiet/core'
import { CardHeader } from '../../ui/CardHeader'
import { IconCheck, IconChevronRight, IconTrophy } from '../../ui/icons'
import { ftueSeen, markFtueSeen, useFtueSeen } from './ftueFlags'

/**
 * Başlangıç görevleri — veriden türeyen 3 küçük hedef; hepsi tamamlanınca
 * bir kez kutlanır ve kart kaybolur. Verisi zaten dolu kurulumlarda
 * (eski kullanıcı) hiç görünmeden sessizce kapanır.
 */
export function StarterTasksCard({
  profileId,
  onAddFood,
}: {
  profileId: number
  onAddFood: () => void
}) {
  const navigate = useNavigate()
  const shown = useFtueSeen('starterShown')
  const done = useFtueSeen('starterDone')

  const loggedDates = useLiveQuery(() => mealRepo.loggedDates(profileId), [profileId])
  const waterLogs = useLiveQuery(
    () => waterRepo.forRange(profileId, '0000-01-01', '9999-12-31'),
    [profileId],
  )
  // Ölçüm yokluğu ile "sorgu henüz dönmedi"yi ayırmak için null'a çevrilir
  const latestMeasurement = useLiveQuery(
    () => measurementRepo.latest(profileId).then((m) => m ?? null),
    [profileId],
  )

  const loading =
    loggedDates === undefined || waterLogs === undefined || latestMeasurement === undefined

  const mealDone = (loggedDates?.length ?? 0) > 0
  const waterDone = (waterLogs ?? []).some((w) => w.glasses > 0)
  const measureDone = latestMeasurement != null
  const allDone = mealDone && waterDone && measureDone
  const doneCount = [mealDone, waterDone, measureDone].filter(Boolean).length

  // Kart eksik haliyle bir kez görüldüyse işaretle; görevler daha ilk
  // bakışta zaten tamamsa (eski kullanıcı) kutlamayı sessizce atla
  useEffect(() => {
    if (loading || done) return
    if (!allDone) markFtueSeen('starterShown')
    else if (!ftueSeen('starterShown')) markFtueSeen('starterDone')
  }, [loading, done, allDone])

  if (loading || done) return null

  if (allDone) {
    if (!shown) return null
    return (
      <section className="animate-pop-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-5 text-white shadow-md">
        <IconTrophy className="pointer-events-none absolute -right-3 -bottom-6 h-28 w-28 opacity-20" strokeWidth={1.2} />
        <h2 className="text-lg font-extrabold">Başlangıç görevleri tamam! 🏆</h2>
        <p className="relative mt-1 text-sm text-white/90">
          Öğün, su ve ölçüm — üçü de kayıtta. Artık uygulama tamamen senin ritminde.
        </p>
        <button
          onClick={() => markFtueSeen('starterDone')}
          className="relative mt-3 rounded-xl bg-white/20 px-5 py-2.5 font-semibold ring-1 ring-white/30 backdrop-blur-sm active:scale-95"
        >
          Süper 🎉
        </button>
      </section>
    )
  }

  const tasks = [
    { label: 'İlk öğününü ekle', done: mealDone, action: onAddFood },
    {
      label: 'İlk bardak suyunu işaretle',
      done: waterDone,
      action: () => void waterRepo.setGlasses(profileId, todayISO(), 1),
    },
    { label: 'İlk ölçümünü kaydet', done: measureDone, action: () => navigate('/vucudum') },
  ]

  return (
    <section className="animate-slide-fade-in rounded-2xl bg-surface p-4 shadow-sm">
      <CardHeader
        icon={<IconTrophy className="h-5.5 w-5.5" />}
        iconBg="bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400"
        title="Başlangıç Görevleri"
        meta={
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            {doneCount}/{tasks.length}
          </span>
        }
      />
      <div className="-mx-1 flex flex-col">
        {tasks.map((t) => (
          <button
            key={t.label}
            onClick={t.done ? undefined : t.action}
            disabled={t.done}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-muted"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                t.done
                  ? 'bg-emerald-500 text-white'
                  : 'border-2 border-dashed border-line'
              }`}
            >
              {t.done && <IconCheck className="animate-pop-in h-3.5 w-3.5" strokeWidth={3} />}
            </span>
            <span
              className={`flex-1 text-sm font-semibold ${t.done ? 'text-faint line-through' : ''}`}
            >
              {t.label}
            </span>
            {!t.done && <IconChevronRight className="h-4 w-4 text-faint" />}
          </button>
        ))}
      </div>
    </section>
  )
}
