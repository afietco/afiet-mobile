import {
  MACRO_RANGES,
  activityMeta,
  ageFromBirthDate,
  bmi,
  bmiRange,
  bmr,
  fiberGrams,
  formatNumber,
  tdee,
  turkishUpper,
  waterGlassesFromTdee,
  waterMl,
  type Profile,
} from '@afiet/core'
import { Pressable, View } from 'react-native'
import { measurementRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconDrop, IconWheat } from '@/ui/icons'
import { AfiPose } from '@/ui/maskot'
import { Skeleton } from '@/ui/Skeleton'
import { BmiBar, RANGE_PILL } from './BmiBar'
import { RangedTrend } from './RangedTrend'

/*
 * Embeddable "Sayilarla" panel: BMR/TDEE blocks, the macro compass (water and
 * fiber sit right under the macros, all five boxes share one anatomy: title +
 * value) and the BMI card (value + range pill + range bar + trend chart).
 *
 * The panel brings no screen chrome of its own (no header, no safe area, no
 * scroller, no page padding) so a host can drop it into an existing scroll
 * view. Its two hosts are the /veri route and the "Sayilarla" section of the
 * Hedeflerim screen.
 */

const MACROS = [
  {
    name: 'Protein',
    ...MACRO_RANGES.protein,
    box: 'bg-orange-50 dark:bg-orange-950/40',
    title: 'text-orange-600 dark:text-orange-300',
    value: 'text-orange-800 dark:text-orange-100',
  },
  {
    name: 'Karbonhidrat',
    ...MACRO_RANGES.carb,
    box: 'bg-amber-50 dark:bg-amber-950/40',
    title: 'text-amber-600 dark:text-amber-300',
    value: 'text-amber-800 dark:text-amber-100',
  },
  {
    name: 'Yağ',
    ...MACRO_RANGES.fat,
    box: 'bg-lime-50 dark:bg-lime-950/40',
    title: 'text-lime-600 dark:text-lime-300',
    value: 'text-lime-800 dark:text-lime-100',
  },
]

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const num1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })
const num2 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 })
/** Range rounded to 5 g; anything finer would be false precision. */
const grams = (kcal: number, pct: number, kcalPerG: number) =>
  num0.format(Math.round((kcal * pct) / kcalPerG / 5) * 5)

export interface NumbersPanelProps {
  /**
   * Active profile. A host that already subscribes to it should pass it so the
   * panel does not open a second profile subscription; `null` means the profile
   * is not set up yet. Leave it out and the panel resolves the profile itself.
   */
  profile?: Profile | null
  /** Wrapper classes; outer spacing belongs to the host. */
  className?: string
}

/**
 * The numbers behind the body metrics. Renders its own loading, error and
 * "not enough data yet" states so a host never has to mirror the query.
 */
export function NumbersPanel({ profile, className }: NumbersPanelProps) {
  // The profile is resolved in a wrapper rather than inline, so that a host
  // which already holds it never pays for a second live subscription.
  if (profile === undefined) return <ConnectedNumbersPanel className={className} />
  return <NumbersPanelContent profile={profile} className={className} />
}

function ConnectedNumbersPanel({ className }: { className?: string }) {
  const { profile, loading, error, retry } = useActiveProfile()

  if (loading) return <PanelFallback className={className} />
  if (error) return <PanelFallback className={className} error={error} onRetry={retry} />
  return <NumbersPanelContent profile={profile} className={className} />
}

function NumbersPanelContent({
  profile,
  className,
}: {
  profile: Profile | null
  className?: string
}) {
  const { isDark } = useTheme()
  const profileId = profile?.id ?? null

  const measurementsQuery = useLive(
    ['measurements'],
    () => (profileId ? measurementRepo.forProfile(profileId) : Promise.resolve([])),
    [profileId],
  )

  if (measurementsQuery.data === undefined)
    return (
      <PanelFallback
        className={className}
        error={measurementsQuery.error}
        onRetry={measurementsQuery.retry}
      />
    )

  const measurements = measurementsQuery.data
  const latest = measurements.at(-1)
  const { sex, birthDate, heightCm, activityLevel } = profile ?? {}

  // Same readiness gate as before: the four body attributes plus one weight
  // entry. Written as a guard so the metrics below need no non-null assertions.
  if (!sex || !birthDate || !heightCm || !activityLevel || !latest)
    return (
      <View className={`items-center rounded-2xl bg-surface p-4 ${className ?? ''}`}>
        <AfiPose pose="merak" size={88} />
        <AppText className="mt-2 text-center text-sm text-soft">
          Buradaki verileri görebilmek için Vücudum ekranından bilgilerini ve ilk kilo ölçümünü
          ekleyelim 🌱
        </AppText>
      </View>
    )

  const bmrValue = bmr(sex, latest.weightKg, heightCm, ageFromBirthDate(birthDate))
  const tdeeValue = tdee(bmrValue, activityLevel)
  const act = activityMeta(activityLevel)
  const bmiVal = bmi(latest.weightKg, heightCm)
  const bmiPoints = measurements.map((m) => ({ date: m.date, value: bmi(m.weightKg, heightCm) }))

  return (
    <View className={`gap-3 ${className ?? ''}`}>
      <View className="rounded-2xl bg-surface p-4">
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-muted p-4">
            <AppText weight="bold" className="text-xs uppercase text-faint">
              BMR
            </AppText>
            <AppText weight="extrabold" className="mt-1 text-2xl text-ink">
              {num0.format(Math.round(bmrValue))}
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
              {num0.format(Math.round(tdeeValue))}
              <AppText weight="semibold" className="text-sm text-violet-600 dark:text-violet-300">
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
            {num0.format(Math.round(bmrValue))} × {num2.format(act.multiplier)}
            <AppText className="text-xs text-faint"> ({act.label})</AppText> ={' '}
            <AppText weight="bold" className="text-sm text-ink">
              {num0.format(Math.round(tdeeValue))} kcal
            </AppText>
          </AppText>
        </View>
      </View>

      <View className="rounded-2xl bg-surface p-4">
        <AppText weight="bold" className="mb-2 text-ink">
          Makro pusulası
        </AppText>
        <View className="gap-2">
          {/* All five boxes share one anatomy: 9px title + value. The 9px size
              also keeps "Karbonhidrat" on a single line in a narrow box. */}
          <View className="flex-row gap-2">
            {MACROS.map((m) => (
              <View key={m.name} className={`flex-1 rounded-2xl p-3 ${m.box}`}>
                <AppText weight="bold" className={`text-[9px] ${m.title}`}>
                  {turkishUpper(m.name)}
                </AppText>
                <AppText weight="extrabold" className={`mt-1 text-base ${m.value}`}>
                  {grams(tdeeValue, m.pctMin, m.kcalPerG)}–
                  {grams(tdeeValue, m.pctMax, m.kcalPerG)}
                  <AppText weight="semibold" className={`text-xs ${m.value}`}>
                    {' '}
                    g
                  </AppText>
                </AppText>
              </View>
            ))}
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-sky-50 p-3 dark:bg-sky-950/40">
              <View className="flex-row items-center gap-1">
                <IconDrop size={12} color={isDark ? '#7dd3fc' : '#0284c7'} />
                <AppText
                  weight="bold"
                  className="text-[9px] uppercase text-sky-600 dark:text-sky-300"
                >
                  Su
                </AppText>
              </View>
              <AppText weight="extrabold" className="mt-1 text-base text-sky-800 dark:text-sky-100">
                {num1.format(waterMl(tdeeValue) / 1000)}
                <AppText weight="semibold" className="text-xs text-sky-800 dark:text-sky-100">
                  {' '}
                  L
                </AppText>
                <AppText weight="semibold" className="text-xs text-sky-600 dark:text-sky-300">
                  {'  '}≈ {waterGlassesFromTdee(tdeeValue)} bardak
                </AppText>
              </AppText>
            </View>
            <View className="flex-1 rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/40">
              <View className="flex-row items-center gap-1">
                <IconWheat size={12} color={isDark ? '#fcd34d' : '#d97706'} />
                <AppText
                  weight="bold"
                  className="text-[9px] uppercase text-amber-600 dark:text-amber-300"
                >
                  Lif
                </AppText>
              </View>
              <AppText
                weight="extrabold"
                className="mt-1 text-base text-amber-800 dark:text-amber-100"
              >
                {num0.format(Math.round(fiberGrams(tdeeValue)))}
                <AppText weight="semibold" className="text-xs text-amber-800 dark:text-amber-100">
                  {' '}
                  g
                </AppText>
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View className="rounded-2xl bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <AppText weight="bold" className="text-xs uppercase text-faint">
            BMI
          </AppText>
          <View className={`rounded-full px-2.5 py-0.5 ${RANGE_PILL[bmiRange(bmiVal).color].box}`}>
            <AppText
              weight="semibold"
              className={`text-xs ${RANGE_PILL[bmiRange(bmiVal).color].text}`}
            >
              {bmiRange(bmiVal).label}
            </AppText>
          </View>
        </View>
        <AppText weight="extrabold" className="mt-1 text-2xl text-ink">
          {formatNumber(bmiVal)}
        </AppText>
        <BmiBar value={bmiVal} />
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
  )
}

/** Inline loading and error state; the page-level skeleton would be chrome. */
function PanelFallback({
  className,
  error,
  onRetry,
}: {
  className?: string
  error?: unknown
  onRetry?: () => void
}) {
  if (error != null)
    return (
      <View className={`items-center rounded-2xl bg-surface p-4 ${className ?? ''}`}>
        <AfiPose pose="cevrimdisi" size={72} />
        <AppText className="mt-2 text-center text-sm text-soft">
          Sayıları şu an getiremedim. Birazdan yeniden deneyebilirsin.
        </AppText>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sayıları yeniden yükle"
            onPress={onRetry}
            className="mt-3 rounded-xl bg-violet-600 px-5 py-3.5 active:opacity-90"
          >
            <AppText weight="semibold" className="text-white">
              Tekrar dene
            </AppText>
          </Pressable>
        ) : null}
      </View>
    )

  return (
    <View className={`gap-3 ${className ?? ''}`}>
      <Skeleton height={160} radius={16} />
      <Skeleton height={180} radius={16} />
      <Skeleton height={150} radius={16} />
    </View>
  )
}
