import { IconFlame } from '../../ui/icons'

/* Konfeti parçaları — deterministik yerleşim (sol %, gecikme, süre, renk).
   Renkler uygulamanın aksan paletinden. */
const CONFETTI: { left: number; delay: number; duration: number; color: string; tilt: number }[] = [
  { left: 6, delay: 0, duration: 2.2, color: '#10b981', tilt: 12 },
  { left: 14, delay: 0.35, duration: 2.6, color: '#f59e0b', tilt: -20 },
  { left: 22, delay: 0.1, duration: 2.1, color: '#8b5cf6', tilt: 30 },
  { left: 30, delay: 0.5, duration: 2.8, color: '#0ea5e9', tilt: -8 },
  { left: 38, delay: 0.2, duration: 2.4, color: '#d946ef', tilt: 18 },
  { left: 46, delay: 0.6, duration: 2.3, color: '#10b981', tilt: -25 },
  { left: 54, delay: 0.05, duration: 2.7, color: '#f59e0b', tilt: 8 },
  { left: 62, delay: 0.45, duration: 2.2, color: '#0ea5e9', tilt: -15 },
  { left: 70, delay: 0.25, duration: 2.5, color: '#8b5cf6', tilt: 22 },
  { left: 78, delay: 0.55, duration: 2.3, color: '#d946ef', tilt: -12 },
  { left: 86, delay: 0.15, duration: 2.6, color: '#10b981', tilt: 16 },
  { left: 94, delay: 0.4, duration: 2.4, color: '#f59e0b', tilt: -28 },
]

interface FirstLogCelebrationProps {
  foodName: string
  onClose: () => void
}

/** İlk besin kaydı kutlaması — konfetili tam ekran an, bir kez gösterilir */
export function FirstLogCelebration({ foodName, onClose }: FirstLogCelebrationProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} aria-hidden />

      {CONFETTI.map((c, i) => (
        <span
          key={i}
          aria-hidden
          className="animate-confetti pointer-events-none absolute top-0 h-3 w-1.5 rounded-full"
          style={{
            left: `${c.left}%`,
            backgroundColor: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            rotate: `${c.tilt}deg`,
          }}
        />
      ))}

      <div className="animate-pop-in relative z-10 w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-2xl">
        <span className="text-6xl">🎉</span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight">İlk kaydın!</h2>
        <p className="mt-2 text-soft">
          “{foodName}” ile denge skorun işlemeye başladı. Her kayıt, gününü biraz daha görünür
          kılar.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1.5 text-sm font-bold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
          <IconFlame className="h-4.5 w-4.5" />
          Seri başladı — 1. gün
        </span>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-emerald-600 py-3.5 font-bold text-white active:scale-[0.98]"
        >
          Devam ✨
        </button>
      </div>
    </div>
  )
}
