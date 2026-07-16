import {
  CORE_GROUPS,
  MEAL_TYPES,
  addDays,
  dayBalance,
  formatLongTR,
  formatNumber,
  formatShortTR,
  fromISO,
  relativeDayLabel,
  todayISO,
  type MealEntry,
  type Measurement,
} from '@afiet/core'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { mealRepo, measurementRepo, waterRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { useWaterTarget } from '@/features/body/useWaterTarget'
import { FirstVisitIntro } from '@/features/ftue/FirstVisitIntro'
import { BalanceSummary } from '@/features/nutrition/BalanceSummary'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { RhythmHistoryCard } from '@/features/sofra/RhythmHistoryCard'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import { IconCalendar, IconChevronRight, IconDrop, IconScale } from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/* Geçmiş — web HistoryPage.tsx portu (FirstVisitIntro Faz 10'da) */

const DAYS = 7

const dayFmt = new Intl.DateTimeFormat('tr-TR', { day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat('tr-TR', { month: 'short' })
const weekdayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'long' })

function DayDetailSheet({
  date,
  entries,
  glasses,
  waterTarget,
  measurement,
  onClose,
}: {
  date: string | null
  entries: MealEntry[]
  glasses: number
  waterTarget: number
  measurement?: Measurement
  onClose: () => void
}) {
  const { isDark } = useTheme()
  const mealsWithEntries = MEAL_TYPES.filter((m) => entries.some((e) => e.meal === m.key))
  return (
    <Sheet
      open={date !== null}
      onClose={onClose}
      title={
        <AppText weight="bold" className="text-lg text-ink">
          {date ? (relativeDayLabel(date) ?? formatShortTR(date)) : ''}
        </AppText>
      }
    >
      {date && (
        <>
          <AppText className="-mt-2 mb-3 text-sm text-faint">{formatLongTR(date)}</AppText>
          <View className="gap-3 rounded-2xl bg-canvas p-3">
            <BalanceSummary entries={entries} />

            <View className="flex-row items-center justify-between rounded-2xl bg-surface p-4">
              <View className="flex-row items-center gap-2">
                <IconDrop size={20} color="#0ea5e9" />
                <AppText weight="bold" className="text-ink">
                  Su
                </AppText>
              </View>
              <AppText weight="semibold" className="text-sm text-sky-500">
                {glasses}/{waterTarget} bardak
              </AppText>
            </View>

            {measurement && (
              <View className="flex-row items-center gap-3 rounded-2xl bg-violet-50 p-4 dark:bg-violet-950/40">
                <View className="h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/60">
                  <IconScale size={22} color={isDark ? '#c4b5fd' : '#7c3aed'} />
                </View>
                <View className="min-w-0 flex-1">
                  <AppText weight="bold" className="text-sm text-violet-800 dark:text-violet-200">
                    Bu gün ölçüm alındı
                  </AppText>
                  <AppText className="text-sm text-violet-700/90 dark:text-violet-300/90">
                    {formatNumber(measurement.weightKg)} kg
                    {measurement.waistCm != null && ` · Bel ${formatNumber(measurement.waistCm)}`}
                    {measurement.neckCm != null && ` · Boyun ${formatNumber(measurement.neckCm)}`}
                    {measurement.hipCm != null && ` · Kalça ${formatNumber(measurement.hipCm)}`}
                  </AppText>
                </View>
              </View>
            )}

            {mealsWithEntries.length === 0 ? (
              <AppText className="py-2 text-center text-sm text-faint">
                Bu güne öğün girilmemiş.
              </AppText>
            ) : (
              mealsWithEntries.map((m) => (
                <View key={m.key} className="rounded-2xl bg-surface p-4">
                  <View className="mb-2 flex-row items-center gap-2">
                    <MealIcon meal={m.key} size={20} />
                    <AppText weight="bold" className="text-ink">
                      {m.label}
                    </AppText>
                  </View>
                  <View className="gap-1.5">
                    {entries
                      .filter((e) => e.meal === m.key)
                      .map((e) => (
                        <View key={e.id} className="flex-row items-center justify-between gap-2">
                          <AppText numberOfLines={1} className="min-w-0 shrink text-sm text-ink">
                            {e.foodName}
                          </AppText>
                          {e.groups.length > 0 && (
                            <View className="shrink-0 flex-row items-center gap-1">
                              {e.groups.map((g) => (
                                <GroupIcon key={g} group={g} size={16} />
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </Sheet>
  )
}

export default function GecmisScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { id: profileId, profile } = useActiveProfile()
  const today = todayISO()
  const from = addDays(today, -(DAYS - 1))
  const [openDate, setOpenDate] = useState<string | null>(null)
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)

  const meals =
    useLive(
      ['meals'],
      () => (profileId ? mealRepo.forRange(profileId, from, today) : Promise.resolve([])),
      [profileId, from, today],
    ) ?? []
  const water =
    useLive(
      ['water'],
      () => (profileId ? waterRepo.forRange(profileId, from, today) : Promise.resolve([])),
      [profileId, from, today],
    ) ?? []
  const measurements =
    useLive(
      ['measurements'],
      () => (profileId ? measurementRepo.forRange(profileId, from, today) : Promise.resolve([])),
      [profileId, from, today],
    ) ?? []
  const loggedDates = useLive(
    ['meals'],
    () => (profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId],
  )
  const firstMeasurement = useLive(
    ['measurements'],
    () =>
      profileId
        ? measurementRepo.forProfile(profileId).then((ms) => ms[0]?.date)
        : Promise.resolve(undefined),
    [profileId],
  )

  if (!profileId) return null

  // İlk kayıttan (öğün / su / ölçüm) önceki günler listelenmez
  const firstDates = [
    loggedDates?.[0],
    water.map((w) => w.date).sort()[0],
    firstMeasurement,
  ].filter((d): d is string => !!d)
  const firstDate = firstDates.length > 0 ? firstDates.sort()[0] : today
  const days = Array.from({ length: DAYS }, (_, i) => addDays(today, -i)).filter(
    (d) => d >= firstDate,
  )

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <AppText weight="extrabold" className="mb-4 text-xl text-ink">
          Geçmiş
        </AppText>

        <View className="mb-4">
          <FirstVisitIntro
            ftueKey="introGecmis"
            colors={['#0284c7', '#6366f1']}
            icon={<IconCalendar size={24} color="#ffffff" />}
            title="Günlerin burada birikir 📅"
            text="Haftalık afiyet ritmin ve son 7 günün denge çubukları burada. Bir güne dokununca o günün öğünlerini, suyunu ve ölçümünü görürsün."
          />
        </View>

        {/* Kesintisiz seri pankartı emekli edildi (afiyet-ritmi.md): kutlanan
            birim artık haftalık ritim, kayıp dili yok. */}
        <RhythmHistoryCard className="mb-4" />

        <View className="gap-2">
          {days.map((date) => {
            const dayEntries = meals.filter((m) => m.date === date)
            const balance = dayBalance(dayEntries)
            const glasses = water.find((w) => w.date === date)?.glasses ?? 0
            const measured = measurements.some((m) => m.date === date)
            const d = fromISO(date)
            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                onPress={() => setOpenDate(date)}
                className="w-full flex-row items-center gap-3 rounded-2xl bg-surface p-3"
              >
                <View className="h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <AppText weight="extrabold" className="text-sm text-ink">
                    {dayFmt.format(d)}
                  </AppText>
                  <AppText className="text-[10px] text-faint">{monthFmt.format(d)}</AppText>
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <AppText weight="semibold" className="text-sm text-ink">
                      {relativeDayLabel(date) ?? weekdayFmt.format(d)}
                    </AppText>
                    {measured && (
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/60">
                        <IconScale size={12} color={isDark ? '#c4b5fd' : '#7c3aed'} />
                      </View>
                    )}
                  </View>
                  <View className="mt-1.5 flex-row items-center gap-1">
                    {CORE_GROUPS.map((g) => (
                      <View
                        key={g}
                        className={`h-1.5 flex-1 rounded-full ${
                          balance.covered.includes(g) ? 'bg-emerald-400' : 'bg-muted'
                        }`}
                      />
                    ))}
                  </View>
                </View>
                <View className="shrink-0 items-end">
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      balance.score >= 4
                        ? 'bg-emerald-100 dark:bg-emerald-900/60'
                        : balance.score >= 2
                          ? 'bg-amber-100 dark:bg-amber-900/50'
                          : 'bg-muted'
                    }`}
                  >
                    <AppText
                      weight="bold"
                      className={`text-xs ${
                        balance.score >= 4
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : balance.score >= 2
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-soft'
                      }`}
                    >
                      {balance.score}/5
                    </AppText>
                  </View>
                  <View className="mt-1 flex-row items-center gap-0.5">
                    <IconDrop size={14} color="#0ea5e9" />
                    <AppText className="text-xs text-sky-500">
                      {glasses}/{waterTarget}
                    </AppText>
                  </View>
                </View>
                <IconChevronRight size={16} color={t.faint} />
              </Pressable>
            )
          })}
        </View>

        <AppText className="mt-4 text-center text-xs text-faint">
          Çubuklar günün kapsadığı 5 temel besin grubunu gösterir. Detay için güne dokun.
        </AppText>
      </ScrollView>

      <DayDetailSheet
        date={openDate}
        entries={meals.filter((m) => m.date === openDate)}
        glasses={water.find((w) => w.date === openDate)?.glasses ?? 0}
        waterTarget={waterTarget}
        measurement={measurements.find((m) => m.date === openDate)}
        onClose={() => setOpenDate(null)}
      />
    </View>
  )
}
