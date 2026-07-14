import { todayISO } from '@afiet/core'
import { StyleSheet, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import type { ApiGroupWeek } from '@/data/api/client'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBowl } from '@/ui/icons'

/**
 * Soframız — grubun ortak haftalık hedefi (backend'in week bloğu). Kişi
 * kırılımı/kıyas YOK: halka toplamı kutlar, gün çubukları grubun gün-gün
 * toplamını gösterir (üye adı geçmez). Tepkiler/selamlar bilinçli olarak
 * YOK (14 Tem geri bildirimi: konsept netleşmeden eklenmeyecek).
 * Bkz. docs/feature-list/aile-sofrasi.md (grup uyarlaması).
 */

const R = 15.5
const C = 2 * Math.PI * R

function GoalRing({ done, goal }: { done: number; goal: number }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const filled = Math.min(1, goal > 0 ? done / goal : 0) * C
  const color = isDark ? '#34d399' : '#059669'
  return (
    <View style={{ width: 64, height: 64 }}>
      <Svg
        width={64}
        height={64}
        viewBox="0 0 36 36"
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        <Circle cx={18} cy={18} r={R} fill="none" strokeWidth={2.6} stroke={t.muted} />
        <Circle
          cx={18}
          cy={18}
          r={R}
          fill="none"
          strokeWidth={2.6}
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={`${filled} ${C}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill} className="items-center justify-center">
        <IconBowl size={24} color={color} strokeWidth={1.7} />
      </View>
    </View>
  )
}

/** Bugünün hafta içi indeksi (Pzt=0) — weekStart yerel YYYY-MM-DD. */
function todayIndex(weekStart: string): number {
  const ms = new Date(todayISO()).getTime() - new Date(weekStart).getTime()
  return Math.round(ms / 86_400_000)
}

/** Gün-gün grup toplamı — 7 mini çubuk (Pzt→Paz), yükseklik = o günün sayısı. */
function WeekBars({ counts, max, today }: { counts: number[]; max: number; today: number }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <View className="flex-row items-end gap-1.5">
      {counts.map((c, i) => {
        const h = max > 0 ? Math.max(4, Math.round((c / max) * 26)) : 4
        const active = i <= today && c > 0
        const color = active ? (isDark ? '#10b981' : '#34d399') : t.muted
        return (
          <View
            key={`d${String(i)}`}
            className="w-2 rounded-full"
            style={{ height: h, backgroundColor: color }}
          />
        )
      })}
    </View>
  )
}

export function SofframizCard({ week, memberCount }: { week: ApiGroupWeek; memberCount: number }) {
  return (
    <View className="mt-4 rounded-2xl bg-surface p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <AppText weight="bold" className="flex-1 text-ink">
          Soframız
        </AppText>
        <AppText className="text-xs text-faint">bu hafta</AppText>
      </View>

      <View className="flex-row items-center gap-4">
        <GoalRing done={week.total} goal={week.goal} />
        <View className="min-w-0 flex-1">
          <AppText weight="extrabold" className="text-lg text-ink">
            {week.total} afiyet günü
          </AppText>
          <AppText className="text-sm text-soft">
            Hedef {week.goal} — hep birlikte, sayısız sofra 🧡
          </AppText>
        </View>
        <WeekBars counts={week.counts} max={memberCount} today={todayIndex(week.weekStart)} />
      </View>
    </View>
  )
}
