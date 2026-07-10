import {
  MACRO_RANGES,
  activityMeta,
  ageFromBirthDate,
  bmi,
  bmr,
  fiberGrams,
  tdee,
  waterGlassesFromTdee,
  waterMl,
} from '@afiet/core'
import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { measurementRepo } from '../../../data/repositories'
import { useLive } from '../../../data/useLive'
import { BmiBar } from '@/features/body/BmiBar'
import { RangedTrend } from '@/features/body/RangedTrend'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconDrop, IconFlame, IconWheat } from '@/ui/icons'

/* Günlük Enerji — eski EnergySheet'in ekran hali. BMR/TDEE blokları ve makro
   pusulası aynen; su & lif ayrı başlık olmaktan çıkıp makroların hemen altına
   geldi, en alta da BMI aralığı barı + gelişim grafiği eklendi (BMI sheet'i
   kalktı; açıklama metinleri şimdilik yok). */

const MACROS = [
  {
    name: 'Protein',
    ...MACRO_RANGES.protein,
    box: 'bg-orange-50 dark:bg-orange-950/40',
    title: 'text-orange-600 dark:text-orange-300',
    value: 'text-orange-800 dark:text-orange-100',
    note: 'text-orange-700/80 dark:text-orange-200/80',
  },
  {
    name: 'Karbonhidrat',
    ...MACRO_RANGES.carb,
    box: 'bg-amber-50 dark:bg-amber-950/40',
    title: 'text-amber-600 dark:text-amber-300',
    value: 'text-amber-800 dark:text-amber-100',
    note: 'text-amber-700/80 dark:text-amber-200/80',
  },
  {
    name: 'Yağ',
    ...MACRO_RANGES.fat,
    box: 'bg-lime-50 dark:bg-lime-950/40',
    title: 'text-lime-600 dark:text-lime-300',
    value: 'text-lime-800 dark:text-lime-100',
    note: 'text-lime-700/80 dark:text-lime-200/80',
  },
]

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const num2 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 })
/** 5 grama yuvarlanmış aralık — sahte hassasiyet vermemek için */
const grams = (kcal: number, pct: number, kcalPerG: number) =>
  num0.format(Math.round((kcal * pct) / kcalPerG / 5) * 5)

export default function EnerjiScreen() {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const { id: profileId, profile } = useActiveProfile()

  const measurements =
    useLive(
      ['measurements'],
      () => (profileId ? measurementRepo.forProfile(profileId) : Promise.resolve([])),
      [profileId],
    ) ?? []

  if (!profileId || !profile) return null

  const hasAttrs = !!(profile.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  const latest = measurements.at(-1)
  const ready = hasAttrs && !!latest

  const bmrValue = ready
    ? bmr(profile.sex!, latest!.weightKg, profile.heightCm!, ageFromBirthDate(profile.birthDate!))
    : null
  const tdeeValue = bmrValue !== null ? tdee(bmrValue, profile.activityLevel!) : null
  const act = ready ? activityMeta(profile.activityLevel!) : null
  const bmiVal = ready ? bmi(latest!.weightKg, profile.heightCm!) : null
  const bmiPoints = hasAttrs
    ? measurements.map((m) => ({ date: m.date, value: bmi(m.weightKg, profile.heightCm!) }))
    : []

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
      >
        <View className="mb-4 flex-row items-center gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Vücudum ekranına dön"
            onPress={() => router.back()}
            className="-ml-2 h-9 w-9 items-center justify-center rounded-full"
          >
            <View style={{ transform: [{ rotate: '180deg' }] }}>
              <IconChevronRight size={20} color={t.faint} />
            </View>
          </Pressable>
          <View>
            <View className="flex-row items-center gap-2">
              <IconFlame size={26} color={violet} />
              <AppText weight="extrabold" className="text-2xl text-ink">
                Günlük Enerji
              </AppText>
            </View>
            <AppText className="text-sm text-soft">Sadece bilgi amaçlı — kalori saymıyoruz 💛</AppText>
          </View>
        </View>

        {!ready ? (
          <View className="rounded-2xl bg-surface p-4">
            <AppText className="text-sm text-soft">
              Günlük enerjini görebilmek için Vücudum ekranından bilgilerini ve ilk kilo ölçümünü
              ekleyelim 🌱
            </AppText>
          </View>
        ) : (
          <View className="gap-3">
            <View className="rounded-2xl bg-surface p-4">
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-muted p-4">
                  <AppText weight="bold" className="text-xs uppercase text-faint">
                    BMR
                  </AppText>
                  <AppText weight="extrabold" className="mt-1 text-2xl text-ink">
                    {num0.format(Math.round(bmrValue!))}
                    <AppText weight="semibold" className="text-sm text-soft">
                      {' '}
                      kcal
                    </AppText>
                  </AppText>
                  <AppText className="mt-1.5 text-xs text-soft">Dinlenirken harcadığın enerji</AppText>
                </View>
                <View className="flex-1 rounded-2xl bg-violet-100 p-4 dark:bg-violet-900/40">
                  <AppText
                    weight="bold"
                    className="text-xs uppercase text-violet-600 dark:text-violet-300"
                  >
                    TDEE
                  </AppText>
                  <AppText
                    weight="extrabold"
                    className="mt-1 text-2xl text-violet-800 dark:text-violet-100"
                  >
                    {num0.format(Math.round(tdeeValue!))}
                    <AppText
                      weight="semibold"
                      className="text-sm text-violet-600 dark:text-violet-300"
                    >
                      {' '}
                      kcal
                    </AppText>
                  </AppText>
                  <AppText className="mt-1.5 text-xs text-violet-700/80 dark:text-violet-200/80">
                    Aktivitenle birlikte günlük ihtiyacın
                  </AppText>
                </View>
              </View>
              <View className="mt-3 rounded-xl bg-muted/60 px-3.5 py-2.5">
                <AppText className="text-center text-sm text-soft">
                  {num0.format(Math.round(bmrValue!))} × {num2.format(act!.multiplier)}
                  <AppText className="text-xs text-faint"> ({act!.label})</AppText> ={' '}
                  <AppText weight="bold" className="text-sm text-ink">
                    {num0.format(Math.round(tdeeValue!))} kcal
                  </AppText>
                </AppText>
              </View>
            </View>

            <View className="rounded-2xl bg-surface p-4">
              <AppText weight="bold" className="mb-1 text-ink">
                Makro pusulası
              </AppText>
              <AppText className="mb-2 text-xs text-faint">
                Dengeli bir gün için yaygın aralıklar, senin enerjine göre:
              </AppText>
              <View className="gap-2">
                <View className="flex-row gap-2">
                  {MACROS.map((m) => (
                    <View key={m.name} className={`flex-1 rounded-2xl p-3 ${m.box}`}>
                      <AppText weight="bold" className={`text-[10px] uppercase ${m.title}`}>
                        {m.name}
                      </AppText>
                      <AppText weight="extrabold" className={`mt-1 text-base ${m.value}`}>
                        {grams(tdeeValue!, m.pctMin, m.kcalPerG)}–
                        {grams(tdeeValue!, m.pctMax, m.kcalPerG)}
                        <AppText weight="semibold" className={`text-xs ${m.value}`}>
                          {' '}
                          g
                        </AppText>
                      </AppText>
                      <AppText className={`mt-0.5 text-[11px] ${m.note}`}>
                        %{num0.format(m.pctMin * 100)}–{num0.format(m.pctMax * 100)}
                      </AppText>
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/40">
                    <View className="flex-row items-center gap-1.5">
                      <IconDrop size={16} color={isDark ? '#7dd3fc' : '#0284c7'} />
                      <AppText
                        weight="bold"
                        className="text-[11px] uppercase text-sky-600 dark:text-sky-300"
                      >
                        Su
                      </AppText>
                    </View>
                    <AppText weight="extrabold" className="mt-1 text-base text-sky-800 dark:text-sky-100">
                      {num1.format(waterMl(tdeeValue!) / 1000)}
                      <AppText weight="semibold" className="text-xs text-sky-800 dark:text-sky-100">
                        {' '}
                        L
                      </AppText>
                      <AppText weight="semibold" className="text-xs text-sky-600 dark:text-sky-300">
                        {'  '}≈ {waterGlassesFromTdee(tdeeValue!)} bardak
                      </AppText>
                    </AppText>
                    <AppText className="mt-0.5 text-[11px] text-sky-700/80 dark:text-sky-200/80">
                      Su kartındaki hedefin buna göre 💧
                    </AppText>
                  </View>
                  <View className="flex-1 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/40">
                    <View className="flex-row items-center gap-1.5">
                      <IconWheat size={16} color={isDark ? '#fcd34d' : '#d97706'} />
                      <AppText
                        weight="bold"
                        className="text-[11px] uppercase text-amber-600 dark:text-amber-300"
                      >
                        Lif
                      </AppText>
                    </View>
                    <AppText
                      weight="extrabold"
                      className="mt-1 text-base text-amber-800 dark:text-amber-100"
                    >
                      {num0.format(Math.round(fiberGrams(tdeeValue!)))}
                      <AppText weight="semibold" className="text-xs text-amber-800 dark:text-amber-100">
                        {' '}
                        g
                      </AppText>
                    </AppText>
                    <AppText className="mt-0.5 text-[11px] text-amber-700/80 dark:text-amber-200/80">
                      Sebze, meyve ve tam tahıldan gelir 🌾
                    </AppText>
                  </View>
                </View>
              </View>
            </View>

            <View className="rounded-2xl bg-surface p-4">
              <BmiBar value={bmiVal!} className="mt-1" />
              {bmiPoints.length >= 2 && (
                <View className="mt-4">
                  <RangedTrend
                    points={bmiPoints}
                    height={80}
                    color={isDark ? '#a78bfa' : '#8b5cf6'}
                    label="BMI değişim grafiği"
                    refBand={{ from: 18.5, to: 25 }}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
