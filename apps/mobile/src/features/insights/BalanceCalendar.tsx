/**
 * Weeks as a grid, one square a day, darker where more food groups were
 * touched.
 *
 * The point is the pattern, not the number: a run of pale weekends says
 * something a list of scores never would. Empty days stay outlined rather than
 * filled at zero, so "no record" reads differently from "a day with one group".
 */
import type { NutritionDay } from '@afiet/core'
import { View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

/** Monday-first index for a local YYYY-MM-DD. */
function weekdayIndex(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  const jsDay = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay()
  return (jsDay + 6) % 7
}

export function BalanceCalendar({ days }: { days: NutritionDay[] }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  if (days.length === 0) return null

  /* Pad the first week so every column really is the weekday it claims. */
  const lead = weekdayIndex(days[0]?.date ?? '')
  const cells: (NutritionDay | null)[] = [...Array.from({ length: lead }, () => null), ...days]
  const weeks: (NutritionDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <View className="rounded-2xl bg-surface p-5">
      <AppText weight="bold" className="mb-1 text-ink">
        Denge takvimin
      </AppText>
      <AppText className="mb-4 text-xs leading-5 text-faint">
        Her kare bir gün; koyulaştıkça o gün beş temel besin grubunun daha
        çoğuna dokunmuşsun. Boş kareler kayıt olmayan günler.
      </AppText>

      <View className="flex-row gap-1.5">
        {WEEKDAYS.map((label) => (
          <AppText key={label} className="flex-1 text-center text-[10px] text-faint">
            {label}
          </AppText>
        ))}
      </View>

      <View className="mt-1.5 gap-1.5">
        {weeks.map((week) => (
          <View key={week.find((d) => d)?.date ?? String(weeks.indexOf(week))} className="flex-row gap-1.5">
            {Array.from({ length: 7 }, (_, index) => {
              const day = week[index] ?? null
              const score = day?.balanceScore ?? 0
              const recorded = day !== null && day.knownCount + day.unknownCount > 0
              return (
                <View
                  key={day?.date ?? `bos-${index}`}
                  accessibilityLabel={
                    day
                      ? `${day.date}: ${recorded ? `${score} grup` : 'kayıt yok'}`
                      : undefined
                  }
                  className="aspect-square flex-1 rounded-md"
                  style={{
                    backgroundColor: recorded ? '#059669' : 'transparent',
                    /* Scores run 0-5; the floor keeps a one group day visible
                       instead of dissolving into the empty state. */
                    opacity: recorded ? 0.25 + (score / 5) * 0.75 : 1,
                    borderWidth: recorded ? 0 : 1,
                    borderColor: t.line,
                  }}
                />
              )
            })}
          </View>
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-end gap-1.5">
        <AppText className="text-[10px] text-faint">az</AppText>
        {[1, 2, 3, 4, 5].map((step) => (
          <View
            key={step}
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: '#059669', opacity: 0.25 + (step / 5) * 0.75 }}
          />
        ))}
        <AppText className="text-[10px] text-faint">çok</AppText>
      </View>
    </View>
  )
}
