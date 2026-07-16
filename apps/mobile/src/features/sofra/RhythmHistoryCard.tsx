import { todayISO } from '@afiet/core'
import { View } from 'react-native'
import type { ApiRhythmHistory } from '@/data/api/client'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl } from '@/ui/icons'
import { RhythmStrip } from './RhythmStrip'
import { useRhythmHistory } from './useRhythmHistory'
import { useRhythmWeek } from './useRhythmWeek'

type HistoryWeek = ApiRhythmHistory['weeks'][number]

/**
 * Afiyet ritmin — Profil'deki haftalık özet kartı: bu haftanın canlı şeridi,
 * kalıcı "toplam afiyet haftası" rozeti ve geçmiş haftaların dökümü.
 * Kayıp dili YOK: düşük haftalar nötr sayıdır, kazanılan haftalar 🧡 alır;
 * kıyas/başarısızlık çerçevesi kurulmaz (afiyet-ritmi.md).
 */

const dayMonthFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' })

/** Hafta aralığı etiketi: "6 Tem – 12 Tem" (yerel tarih aritmetiği). */
function weekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  const start = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1)
  const end = new Date(y ?? 0, (m ?? 1) - 1, (d ?? 1) + 6)
  return `${dayMonthFmt.format(start)} – ${dayMonthFmt.format(end)}`
}

/** Geçmiş hafta satırındaki minik 7 nokta. */
function MiniDots({ days }: { days: boolean[] }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <View className="flex-row items-center gap-1">
      {days.map((filled, i) => (
        <View
          key={`d${String(i)}`}
          className={`h-1.5 w-1.5 rounded-full ${filled ? 'bg-emerald-500' : ''}`}
          style={filled ? undefined : { backgroundColor: t.muted }}
        />
      ))}
    </View>
  )
}

function HistoryRow({ week }: { week: HistoryWeek }) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <AppText numberOfLines={1} className="w-28 text-xs text-soft">
        {weekLabel(week.weekStart)}
      </AppText>
      <View className="flex-1">
        <MiniDots days={week.days} />
      </View>
      <AppText weight="semibold" className="text-xs text-ink">
        {week.done} gün
      </AppText>
      <AppText className="w-5 text-center text-xs">{week.won ? '🧡' : ' '}</AppText>
    </View>
  )
}

export function RhythmHistoryCard({ className = 'mt-4' }: { className?: string }) {
  const { isDark } = useTheme()
  const today = todayISO()
  // Bu haftanın şeridi ve geçmiş dökümü backend'den (summary/week + history).
  const week = useRhythmWeek(today)
  const history = useRhythmHistory(today)

  return (
    <View className={`rounded-2xl bg-surface p-5 ${className}`}>
      <View className="flex-row items-center gap-2">
        <IconBowl size={18} color={isDark ? '#34d399' : '#059669'} />
        <AppText weight="bold" className="flex-1 text-ink">
          Afiyet ritmin
        </AppText>
        {history ? (
          <View className="rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-emerald-950/50">
            <AppText weight="bold" className="text-xs text-emerald-800 dark:text-emerald-200">
              Toplam {history.totalWeeks} hafta 🧡
            </AppText>
          </View>
        ) : null}
      </View>

      {week ? (
        <>
          <RhythmStrip
            week={week.days.map((d) => d.afiyet)}
            todayIndex={week.days.findIndex((d) => d.date === today)}
          />
          <AppText className="mt-2 text-xs text-faint">
            Bu hafta hedef {week.goal} gün · {7 - week.goal} gün sofra payın var
          </AppText>
        </>
      ) : null}

      <AppText weight="semibold" className="mb-1 mt-4 text-sm text-soft">
        Geçmiş haftalar
      </AppText>
      {history === undefined ? null : history && history.weeks.length > 0 ? (
        <View>
          {history.weeks.map((w, i) => (
            <View key={w.weekStart} className={i > 0 ? 'border-t border-line/40' : ''}>
              <HistoryRow week={w} />
            </View>
          ))}
        </View>
      ) : (
        <AppText className="py-2 text-sm text-faint">
          İlk haftan dolunca burada birikmeye başlar 🌱
        </AppText>
      )}
    </View>
  )
}
