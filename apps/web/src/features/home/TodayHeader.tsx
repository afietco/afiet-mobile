import type { FC } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { mealRepo } from '../../data/repositories'
import type { Profile } from '@afiet/core'
import { formatLongTR, todayISO } from '@afiet/core'
import { IconFlame, IconMoon, IconSparkles, IconSun, IconSunrise, type IconProps } from '../../ui/icons'
import { calcStreak } from '@afiet/core'

/** Saate göre karşılama — günün ritmine eşlik eder */
function greeting(): { text: string; Icon: FC<IconProps> } {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return { text: 'Günaydın', Icon: IconSunrise }
  if (h >= 12 && h < 18) return { text: 'Merhaba', Icon: IconSun }
  if (h >= 18 && h < 22) return { text: 'İyi akşamlar', Icon: IconMoon }
  return { text: 'İyi geceler', Icon: IconMoon }
}

export function TodayHeader({ profileId, profile }: { profileId: number; profile?: Profile }) {
  const { text, Icon } = greeting()
  const loggedDates = useLiveQuery(
    () => mealRepo.loggedDates(profileId),
    [profileId],
  )
  const streak = calcStreak(loggedDates ?? [])
  const hasToday = (loggedDates ?? []).includes(todayISO())

  return (
    <header className="animate-slide-fade-in relative mb-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-5 text-white shadow-md">
      {/* Dekor: yumuşak ışık lekesi + filigran ikon */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
      <Icon className="pointer-events-none absolute -right-4 -bottom-8 h-32 w-32 opacity-15" strokeWidth={1.2} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-50/90">
            {text} <Icon className="h-4.5 w-4.5" />
          </p>
          <h1 className="truncate text-3xl font-extrabold tracking-tight">{profile?.name}</h1>
          <p className="mt-0.5 text-sm text-emerald-50/80">{formatLongTR(todayISO())}</p>
        </div>
        <Link
          to="/profil"
          aria-label="Profil"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl ring-1 ring-white/30 backdrop-blur-sm active:scale-95"
        >
          {profile?.emoji}
        </Link>
      </div>

      <div className="relative mt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold ring-1 ring-white/20">
          {streak > 0 ? (
            <>
              <IconFlame className="h-4 w-4 text-amber-300" />
              {streak} gün seri{!hasToday && ' — bugünü de ekle!'}
            </>
          ) : (
            <>
              <IconSparkles className="h-4 w-4 text-amber-300" />
              İlk kaydınla seriyi başlat
            </>
          )}
        </span>
      </div>
    </header>
  )
}
