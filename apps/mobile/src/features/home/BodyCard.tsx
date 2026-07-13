import {
  bmiRange,
  formatNumber,
  formatShortTR,
  relativeDayLabel,
  todayISO,
  type Profile,
} from '@afiet/core'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { measurementRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { useSummary } from '../../data/useSummary'
import { RANGE_DOT } from '../body/BmiBar'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { CardHeader } from '@/ui/CardHeader'
import { IconScale } from '@/ui/icons'

const num0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-1 rounded-xl bg-muted/60 px-2.5 py-2">
      <AppText weight="semibold" className="text-[11px] text-faint">
        {label}
      </AppText>
      <View className="mt-0.5 flex-row items-baseline gap-1">{children}</View>
    </View>
  )
}

/** Dashboard Vücudum kartı — web BodyCard.tsx portu */
export function BodyCard({ profileId, profile }: { profileId: number; profile?: Profile }) {
  const { isDark } = useTheme()
  const measurements =
    useLive(['measurements'], () => measurementRepo.forProfile(profileId), [profileId]) ?? []
  // Türev sayılar backend'den (summary.body). Kilo/fark ham ölçümden.
  const summary = useSummary(todayISO())

  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  const latest = measurements.at(-1)
  const prev = measurements.at(-2)

  const bmiVal = summary?.body?.bmi ?? null
  const bfVal = summary?.body?.bodyFatPercent ?? null
  const tdeeVal = summary?.body?.tdee ?? null
  const diff = latest && prev ? latest.weightKg - prev.weightKg : null

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/vucudum')}
      className="rounded-2xl bg-surface p-4"
    >
      <CardHeader
        icon={<IconScale size={22} color={isDark ? '#a78bfa' : '#7c3aed'} />}
        iconBg="bg-violet-100 dark:bg-violet-900/50"
        title="Vücudum"
        chevron
        meta={
          latest && (
            <AppText className="text-sm text-soft">
              {relativeDayLabel(latest.date) ?? formatShortTR(latest.date)}
            </AppText>
          )
        }
      />

      {!hasAttrs ? (
        <AppText className="text-sm text-soft">
          Boyunu ve birkaç bilgiyi ekleyelim — BMI ve günlük enerji ihtiyacın kendiliğinden
          hesaplansın 🌱
        </AppText>
      ) : !latest ? (
        <AppText className="text-sm text-soft">
          Hazırsın! İlk kilo ölçümünü ekleyerek başla ✨
        </AppText>
      ) : (
        <View className="flex-row gap-2">
          <Stat label="Kilo">
            <AppText weight="extrabold" className="text-lg text-ink">
              {formatNumber(latest.weightKg)}
            </AppText>
            <AppText weight="semibold" className="text-xs text-soft">
              kg
            </AppText>
            {diff !== null && Math.abs(diff) >= 0.05 && (
              <AppText weight="semibold" className="text-[11px] text-faint">
                {diff < 0 ? '↓' : '↑'}
                {formatNumber(Math.abs(diff))}
              </AppText>
            )}
          </Stat>
          <Stat label="BMI">
            <AppText weight="extrabold" className="text-lg text-ink">
              {formatNumber(bmiVal!)}
            </AppText>
            <View className={`h-2 w-2 self-center rounded-full ${RANGE_DOT[bmiRange(bmiVal!).color]}`} />
          </Stat>
          {bfVal !== null ? (
            <Stat label="Yağ">
              <AppText weight="extrabold" className="text-lg text-ink">
                %{formatNumber(bfVal)}
              </AppText>
            </Stat>
          ) : (
            <Stat label="Enerji">
              <AppText weight="extrabold" className="text-lg text-ink">
                {num0.format(Math.round(tdeeVal!))}
              </AppText>
              <AppText weight="semibold" className="text-xs text-soft">
                kcal
              </AppText>
            </Stat>
          )}
        </View>
      )}
    </Pressable>
  )
}
