import {
  MINOR_NOTE,
  ageFromBirthDate,
  bodyFatInvite,
  bodyFatPercent,
  formatKcal,
  formatKg,
  formatLongTR,
  formatNumber,
  todayISO,
  trendMessage,
} from '@afiet/core'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { measurementRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useSummary } from '@/data/useSummary'
import { BmiBar } from '@/features/body/BmiBar'
import { BodySetupSheet } from '@/features/body/BodySetupSheet'
import { MeasurementHistory } from '@/features/body/MeasurementHistory'
import { MeasurementSheet } from '@/features/body/MeasurementSheet'
import {
  DEFAULT_RANGE,
  MonthNav,
  RangeChips,
  calcSpanDays,
  filterByRange,
  maxMonthOffset,
  type TrendRange,
} from '@/features/body/RangedTrend'
import { WeightSparkline } from '@/features/body/WeightSparkline'
import { AppHeader } from '@/features/nav/AppHeader'
import { NotificationsSheet } from '@/features/notifications/NotificationsSheet'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { PageSkeleton } from '@/ui/PageSkeleton'
import {
  IconCalendar,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconRuler,
  IconScale,
  IconTarget,
} from '@/ui/icons'
import { Sheet } from '@/ui/Sheet'

/** Vücudum — web BodyPage.tsx portu */
export default function VucudumScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const { id: profileId, profile } = useActiveProfile()
  const [setupOpen, setSetupOpen] = useState(false)
  const [measureOpen, setMeasureOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [range, setRange] = useState<TrendRange>(DEFAULT_RANGE)

  const measurements =
    useLiveValue(
      ['measurements'],
      () => (profileId ? measurementRepo.forProfile(profileId) : Promise.resolve([])),
      [profileId],
    ) ?? []
  // Güncel türev sayılar backend'den (summary.body). Hook erken return'den ÖNCE.
  const summary = useSummary(todayISO())

  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)

  // Eksik bilgide kurulum sheet'i bir kez kendiliğinden açılır
  const autoOpened = useRef(false)
  useEffect(() => {
    if (profile && !hasAttrs && !autoOpened.current) {
      autoOpened.current = true
      setSetupOpen(true)
    }
  }, [profile, hasAttrs])

  if (!profileId || !profile || summary === undefined) return <PageSkeleton />

  const latest = measurements.at(-1)
  const girthM = measurements.filter((m) => m.waistCm != null && m.neckCm != null).at(-1)

  const age = profile.birthDate ? ageFromBirthDate(profile.birthDate) : null
  // summary yukarıda (hook) — grafik serileri (fatPoints) ölçüm bazlı, client-side.
  const bmiVal = summary?.body?.bmi ?? null
  const bmrVal = summary?.body?.bmr ?? null
  const tdeeVal = summary?.body?.tdee ?? null
  const bfVal = summary?.body?.bodyFatPercent ?? null

  const weightPoints = measurements.map((m) => ({ date: m.date, value: m.weightKg }))
  const fatPoints = hasAttrs
    ? measurements
        .filter((m) => m.waistCm != null && m.neckCm != null)
        .map((m) => ({
          date: m.date,
          value: bodyFatPercent(profile.sex!, profile.heightCm!, m.waistCm!, m.neckCm!, m.hipCm),
        }))
        .filter((p): p is { date: string; value: number } => p.value !== null)
    : []
  // Tarih filtresi iki grafiğe birden uygulanır; başlık değerleri ve trend
  // mesajı da grafikle aynı aralığı anlatır (geçmiş ay gezilirken tutarlı)
  const spanDays = calcSpanDays(weightPoints)
  const weightFiltered = filterByRange(weightPoints, range)
  const fatFiltered = filterByRange(fatPoints, range)
  const browsingPast = range.mode === 'ay' && range.monthOffset > 0
  const headerWeight = weightFiltered.at(-1)?.value ?? latest?.weightKg
  const headerFat = fatFiltered.at(-1)?.value ?? bfVal

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <AppHeader onOpenNotifications={() => setNotifOpen(true)}>
          <View className="flex-row items-center gap-2">
            <IconScale size={26} color={violet} />
            <AppText weight="extrabold" className="text-2xl text-ink">
              Vücudum
            </AppText>
          </View>
          <AppText className="text-sm text-soft">{formatLongTR(todayISO())}</AppText>
        </AppHeader>

        <View className="gap-3">
          {!hasAttrs ? (
            <View className="relative overflow-hidden rounded-3xl p-5">
              <Svg style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id="setup" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#7c3aed" />
                    <Stop offset="0.55" stopColor="#8b5cf6" />
                    <Stop offset="1" stopColor="#d946ef" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#setup)" />
              </Svg>
              <View
                pointerEvents="none"
                className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-white/15"
              />
              <View pointerEvents="none" className="absolute -bottom-8 -right-4 opacity-15">
                <IconScale size={128} color="#ffffff" strokeWidth={1.2} />
              </View>
              <AppText weight="extrabold" className="text-xl text-white">
                Seni tanıyalım 🌱
              </AppText>
              <AppText className="mt-1 text-sm text-violet-50/90">
                Boyunu ve birkaç bilgiyi ekleyelim — BMI ve günlük enerji ihtiyacın kendiliğinden
                hesaplansın.
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setSetupOpen(true)}
                className="mt-4 self-start rounded-xl border border-white/30 bg-white/20 px-5 py-2.5"
              >
                <AppText weight="semibold" className="text-white">
                  Başlayalım
                </AppText>
              </Pressable>
            </View>
          ) : !latest ? (
            <View className="rounded-2xl bg-surface p-4">
              <AppText className="text-sm text-soft">
                Hazırsın! İlk kilo ölçümünü ekleyerek başla ✨
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setMeasureOpen(true)}
                className="mt-3 w-full flex-row items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3.5"
              >
                <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
                <AppText weight="semibold" className="text-white">
                  Ölçüm Ekle
                </AppText>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="flex-row gap-3">
                {/* Hedeflerim — yakında; BMI kartının yerini aldı */}
                <View className="flex-1 rounded-2xl bg-surface p-4">
                  <View className="flex-row items-center justify-between">
                    <AppText weight="bold" className="text-sm text-soft">
                      Hedeflerim
                    </AppText>
                    <View className="rounded-full bg-violet-100 px-2 py-0.5 dark:bg-violet-900/50">
                      <AppText
                        weight="semibold"
                        className="text-[10px] uppercase text-violet-700 dark:text-violet-300"
                      >
                        Yakında
                      </AppText>
                    </View>
                  </View>
                  <View className="mt-2.5">
                    <IconTarget size={22} color={violet} />
                  </View>
                  <AppText className="mt-2 text-xs text-soft">
                    Kendine küçük hedefler koyacağın köşe hazırlanıyor ✨
                  </AppText>
                </View>

                {/* Günlük enerji + BMI'nin birleştiği kart — detay /veri ekranında */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/veri')}
                  className="flex-1 rounded-2xl bg-surface p-4"
                >
                  <View className="flex-row items-center justify-between">
                    <AppText weight="bold" className="text-sm text-soft">
                      Veri Ekranı
                    </AppText>
                    <IconChevronRight size={16} color={t.faint} />
                  </View>
                  <AppText weight="extrabold" className="mt-1 text-3xl text-ink">
                    {formatNumber(Math.round(tdeeVal!))}
                    <AppText weight="semibold" className="text-base text-soft">
                      {' '}
                      kcal
                    </AppText>
                  </AppText>
                  <AppText className="mt-1 text-xs text-soft">BMR: {formatKcal(bmrVal!)}</AppText>
                  <BmiBar value={bmiVal!} className="mt-2.5" />
                </Pressable>
              </View>

              {age !== null && age < 18 && (
                <AppText className="px-1 text-xs text-faint">{MINOR_NOTE}</AppText>
              )}

              <View className="flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMeasureOpen(true)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-3.5"
                >
                  <IconPlus size={18} color="#ffffff" strokeWidth={2.4} />
                  <AppText weight="semibold" className="text-white">
                    Ölçüm Ekle
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setHistoryOpen(true)}
                  className="flex-row items-center justify-center gap-1.5 rounded-xl border-2 border-violet-600 bg-surface px-4 dark:border-violet-500"
                >
                  <IconCalendar size={18} color={violet} />
                  <AppText weight="semibold" className="text-violet-700 dark:text-violet-400">
                    Geçmiş
                  </AppText>
                </Pressable>
              </View>

              <View className="rounded-2xl bg-surface p-4">
                <View className="mb-3 flex-row items-center justify-between gap-2">
                  <AppText weight="bold" className="text-ink">
                    Yolculuk
                  </AppText>
                  <RangeChips spanDays={spanDays} value={range} onChange={setRange} />
                </View>
                <MonthNav value={range} maxOffset={maxMonthOffset(weightPoints)} onChange={setRange} />

                <View className="mb-1 flex-row items-baseline justify-between">
                  <AppText weight="bold" className="text-sm text-soft">
                    Kilo (kg)
                  </AppText>
                  {headerWeight != null && (
                    <AppText weight="semibold" className="text-sm text-soft">
                      {formatKg(headerWeight)}
                    </AppText>
                  )}
                </View>
                {measurements.length < 2 ? (
                  <AppText className="pb-2 text-sm text-faint">
                    İki ölçümden sonra burada kilonun yolculuğunu göreceksin 📈
                  </AppText>
                ) : weightFiltered.length === 0 ? (
                  <AppText className="py-4 text-center text-sm text-faint">Bu ayda ölçüm yok</AppText>
                ) : (
                  <>
                    <WeightSparkline
                      points={weightFiltered}
                      height={88}
                      showLabels
                      color={isDark ? '#a78bfa' : '#8b5cf6'}
                    />
                    {weightFiltered.length >= 2 && (
                      <AppText className="mt-1.5 text-sm text-soft">
                        {trendMessage(
                          weightFiltered[weightFiltered.length - 2].value,
                          weightFiltered[weightFiltered.length - 1].value,
                          browsingPast ? 'range' : 'now',
                        )}
                      </AppText>
                    )}
                  </>
                )}

                <View className="my-3 border-t border-line/40" />

                <View className="mb-1 flex-row items-baseline justify-between">
                  <AppText weight="bold" className="text-sm text-soft">
                    Yağ Oranı (%)
                  </AppText>
                  {headerFat != null && (
                    <AppText weight="semibold" className="text-sm text-soft">
                      %{formatNumber(headerFat)}
                    </AppText>
                  )}
                </View>
                {fatPoints.length === 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setMeasureOpen(true)}
                    className="w-full flex-row items-center gap-2.5 rounded-xl bg-violet-50 px-3.5 py-3 dark:bg-violet-950/50"
                  >
                    <IconRuler size={20} color={violet} />
                    <AppText className="flex-1 text-sm text-violet-800 dark:text-violet-200">
                      {bodyFatInvite(profile.sex!)}
                    </AppText>
                  </Pressable>
                ) : fatPoints.length < 2 ? (
                  <AppText className="pb-1 text-sm text-faint">
                    İki mezura ölçümünden sonra burada yağ oranının yolculuğunu göreceksin 📈
                  </AppText>
                ) : fatFiltered.length === 0 ? (
                  <AppText className="py-4 text-center text-sm text-faint">Bu ayda ölçüm yok</AppText>
                ) : (
                  <WeightSparkline
                    points={fatFiltered}
                    height={88}
                    showLabels
                    color={isDark ? '#e879f9' : '#d946ef'}
                    label="Vücut yağ oranı değişim grafiği"
                  />
                )}
              </View>
            </>
          )}

          {hasAttrs && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSetupOpen(true)}
              className="flex-row items-center gap-1.5 self-center py-1"
            >
              <IconPencil size={16} color={violet} />
              <AppText weight="semibold" className="text-sm text-violet-600 dark:text-violet-400">
                Bilgilerini düzenle
              </AppText>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />

      <BodySetupSheet profile={profile} open={setupOpen} onClose={() => setSetupOpen(false)} />
      <MeasurementSheet
        profileId={profileId}
        sex={profile.sex}
        latest={latest}
        open={measureOpen}
        onClose={() => setMeasureOpen(false)}
      />
      <Sheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={
          <>
            <IconCalendar size={22} color={violet} />
            <AppText weight="bold" className="text-lg text-ink">
              Ölçüm Geçmişi
            </AppText>
          </>
        }
      >
        <MeasurementHistory measurements={measurements} />
      </Sheet>
    </View>
  )
}
