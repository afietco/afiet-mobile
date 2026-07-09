import type { ReactNode } from 'react'
import { IconX } from '../../ui/icons'
import { markFtueSeen, useFtueSeen, type FtueKey } from './ftueFlags'

interface FirstVisitIntroProps {
  ftueKey: FtueKey
  /** Gradient zemin sınıfları (bg-gradient-to-* from-* to-*) */
  gradient: string
  icon: ReactNode
  title: string
  text: string
  className?: string
}

/** Mikro-FTUE: bir bölüme ilk girişte tek seferlik tanıtım kartı */
export function FirstVisitIntro({
  ftueKey,
  gradient,
  icon,
  title,
  text,
  className = '',
}: FirstVisitIntroProps) {
  const seen = useFtueSeen(ftueKey)
  if (seen) return null

  return (
    <section
      className={`animate-slide-fade-in relative overflow-hidden rounded-2xl p-4 text-white shadow-md ${gradient} ${className}`}
    >
      <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold">{title}</h2>
          <p className="mt-0.5 text-sm text-white/85">{text}</p>
        </div>
        <button
          onClick={() => markFtueSeen(ftueKey)}
          aria-label="Tanıtımı kapat"
          className="-mt-1 -mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 active:scale-90"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
