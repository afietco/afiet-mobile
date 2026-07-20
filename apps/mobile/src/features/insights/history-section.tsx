import {
  CORE_GROUPS,
  MEAL_TYPES,
  addDays,
  dayBalance,
  formatMealAmount,
  formatLongTR,
  formatNumber,
  formatShortTR,
  fromISO,
  relativeDayLabel,
  todayISO,
  type MealEntry,
  type Measurement,
} from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { mealRepo, measurementRepo, waterRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useWaterTarget } from '@/features/body/useWaterTarget'
import { FirstVisitIntro } from '@/features/ftue/FirstVisitIntro'
import { recentHistoryDays } from '@/features/insights/history-days'
import { AddFoodSheet } from '@/features/nutrition/AddFoodSheet'
import { BalanceSummary } from '@/features/nutrition/BalanceSummary'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { GroupIcon, MealIcon } from '@/ui/appIcons'
import {
  IconCalendar,
  IconChevronRight,
  IconDrop,
  IconPlus,
  IconPencil,
  IconScale,
  IconTrash,
} from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { PageSkeleton } from '@/ui/PageSkeleton'
import { Sheet } from '@/ui/Sheet'

/* Recent daily logs with editing and deletion controls. */

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
  deletingId,
  onEdit,
  onDelete,
  onClose,
}: {
  date: string | null
  entries: MealEntry[]
  glasses: number
  waterTarget: number
  measurement?: Measurement
  deletingId: number | null
  onEdit: (entry: MealEntry) => void
  onDelete: (entry: MealEntry) => void
  onClose: () => void
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
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
                        <View key={e.id} className="flex-row items-center gap-2">
                          <View className="min-w-0 flex-1 flex-row items-center gap-2">
                            <View className="min-w-0 flex-1">
                              <AppText numberOfLines={1} className="text-sm text-ink">
                                {e.foodName}
                              </AppText>
                              <AppText className="text-xs text-soft">{formatMealAmount(e)}</AppText>
                            </View>
                            {e.groups.length > 0 && (
                              <View className="shrink-0 flex-row items-center gap-1">
                                {e.groups.map((g) => (
                                  <GroupIcon key={g} group={g} size={16} />
                                ))}
                              </View>
                            )}
                          </View>
                          {e.id !== undefined && (
                            <View className="shrink-0 flex-row items-center gap-1">
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`${e.foodName} kaydını düzenle`}
                                accessibilityState={{ disabled: deletingId === e.id }}
                                onPress={() => {
                                  void Haptics.selectionAsync()
                                  onEdit(e)
                                }}
                                disabled={deletingId === e.id}
                                className="h-11 w-11 items-center justify-center rounded-xl bg-muted"
                              >
                                <IconPencil size={17} color={t.soft} />
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`${e.foodName} kaydını sil`}
                                accessibilityState={{
                                  disabled: deletingId !== null,
                                  busy: deletingId === e.id,
                                }}
                                onPress={() => onDelete(e)}
                                disabled={deletingId !== null}
                                className={`h-11 w-11 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 ${
                                  deletingId !== null ? 'opacity-40' : ''
                                }`}
                              >
                                <IconTrash size={17} color={isDark ? '#fb7185' : '#e11d48'} />
                              </Pressable>
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

export function HistorySection() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { id: profileId, profile } = useActiveProfile()
  const today = todayISO()
  const from = addDays(today, -(DAYS - 1))
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const waterTarget = useWaterTarget(profileId, profile ?? undefined)

  const mealsQuery = useLive(
    ['meals'],
    () => (profileId ? mealRepo.forRange(profileId, from, today) : Promise.resolve([])),
    [profileId, from, today],
  )
  const waterQuery = useLive(
    ['water'],
    () => (profileId ? waterRepo.forRange(profileId, from, today) : Promise.resolve([])),
    [profileId, from, today],
  )
  const measurementsQuery = useLive(
    ['measurements'],
    () => (profileId ? measurementRepo.forRange(profileId, from, today) : Promise.resolve([])),
    [profileId, from, today],
  )
  const loggedDatesQuery = useLive(
    ['meals'],
    () => (profileId ? mealRepo.loggedDates(profileId) : Promise.resolve([])),
    [profileId],
  )
  const firstMeasurementQuery = useLive(
    ['measurements'],
    () =>
      profileId
        ? measurementRepo.forProfile(profileId).then((ms) => ms[0]?.date)
        : Promise.resolve(undefined),
    [profileId],
  )

  const queries = [
    mealsQuery,
    waterQuery,
    measurementsQuery,
    loggedDatesQuery,
    firstMeasurementQuery,
  ]
  const blockingError = queries.find(
    (query) => query.data === undefined && query.error !== null,
  )?.error
  const retryAll = () => queries.forEach((query) => query.retry())

  if (!profileId || queries.some((query) => query.loading) || blockingError)
    return <PageSkeleton error={blockingError} onRetry={retryAll} />

  const meals = mealsQuery.data ?? []
  const water = waterQuery.data ?? []
  const measurements = measurementsQuery.data ?? []
  const loggedDates = loggedDatesQuery.data ?? []
  const firstMeasurement = firstMeasurementQuery.data

  // Days before the user's first meal, water, or measurement log stay hidden.
  const firstDates = [
    loggedDates?.[0],
    water.map((w) => w.date).sort()[0],
    firstMeasurement,
  ].filter((d): d is string => !!d)
  const days = recentHistoryDays(today, firstDates, DAYS)

  const confirmDelete = (entry: MealEntry) => {
    if (entry.id === undefined || deletingId !== null) return
    Alert.alert('Öğün kaydı silinsin mi?', `“${entry.foodName}” bu günden kaldırılacak.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          const id = entry.id
          if (id === undefined) return
          setDeletingId(id)
          void mealRepo
            .remove(id)
            .then(() => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            })
            .catch(() => {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
              Alert.alert('Kayıt silinemedi', 'Bağlantını kontrol edip tekrar dener misin?')
            })
            .finally(() => setDeletingId(null))
        },
      },
    ])
  }

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <View className="mb-4">
          <FirstVisitIntro
            ftueKey="introGecmis"
            colors={['#0284c7', '#6366f1']}
            icon={<IconCalendar size={24} color="#ffffff" />}
            title="Günlerin burada birikir 📅"
            text="Son 7 gününün denge çubukları burada. Bir güne dokununca o günün öğünlerini, suyunu ve ölçümünü görürsün. Afiyet ritmin artık Beslenme sayfasında."
          />
        </View>

        {days.length === 0 ? (
          <View className="items-center rounded-3xl bg-surface px-6 py-8">
            <AfiPose pose="kasik" size={88} />
            <AppText weight="extrabold" className="mt-3 text-center text-xl text-ink">
              Geçmişin ilk kaydınla başlar
            </AppText>
            <AppText className="mt-2 text-center text-sm text-soft">
              Bugün ne yediğini eklediğinde günlerin burada usulca birikmeye başlayacak.
            </AppText>
            <Link href="/ekle" asChild>
              <Pressable
                accessibilityRole="button"
                className="mt-5 min-h-11 flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5"
              >
                <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
                <AppText weight="bold" className="text-white">
                  İlk kaydını ekle
                </AppText>
              </Pressable>
            </Link>
          </View>
        ) : (
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
        )}

        {days.length > 0 ? (
          <AppText className="mt-4 text-center text-xs text-faint">
            Çubuklar günün kapsadığı 5 temel besin grubunu gösterir. Detay için güne dokun.
          </AppText>
        ) : null}
      </ScrollView>

      <DayDetailSheet
        date={editingEntry ? null : openDate}
        entries={meals.filter((m) => m.date === openDate)}
        glasses={water.find((w) => w.date === openDate)?.glasses ?? 0}
        waterTarget={waterTarget}
        measurement={measurements.find((m) => m.date === openDate)}
        deletingId={deletingId}
        onEdit={setEditingEntry}
        onDelete={confirmDelete}
        onClose={() => setOpenDate(null)}
      />

      {editingEntry && (
        <AddFoodSheet
          profileId={profileId}
          date={editingEntry.date}
          open
          meal={null}
          initialEntry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </View>
  )
}
