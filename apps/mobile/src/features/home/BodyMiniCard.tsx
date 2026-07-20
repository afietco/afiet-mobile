import { formatNumber, todayISO, type Profile } from '@afiet/core'
import { router } from 'expo-router'
import { forwardRef } from 'react'
import { Pressable, View } from 'react-native'
import { measurementRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useSummary } from '@/data/useSummary'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconScale } from '@/ui/icons'

interface BodyMiniCardProps {
  profileId: number
  profile?: Profile
  guideHidden?: boolean
  onPress?: () => void
}

/** Half-width body summary for Today. The full card lives under /vucudum. */
export const BodyMiniCard = forwardRef<View, BodyMiniCardProps>(function BodyMiniCard(
  { profileId, profile, guideHidden = false, onPress },
  ref,
) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const latest = useLiveValue(
    ['measurements'],
    () => measurementRepo.latest(profileId),
    [profileId],
  )
  const summary = useSummary(todayISO())

  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  const bmiVal = summary?.body?.bmi ?? null

  return (
    <Pressable
      ref={ref}
      collapsable={false}
      accessibilityRole="button"
      importantForAccessibility={guideHidden ? 'no-hide-descendants' : 'auto'}
      onPress={onPress ?? (() => router.push('/vucudum'))}
      className="flex-1 rounded-2xl bg-surface p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
          <IconScale size={20} color={violet} />
        </View>
        <IconChevronRight size={16} color={t.faint} />
      </View>
      <AppText weight="bold" className="mt-2 text-ink">
        Vücudum
      </AppText>
      {hasAttrs && latest ? (
        <View className="mt-0.5 flex-row items-baseline gap-1.5">
          <AppText weight="extrabold" className="text-lg text-ink">
            {formatNumber(latest.weightKg)}
          </AppText>
          <AppText weight="semibold" className="text-xs text-soft">
            kg
          </AppText>
          {bmiVal != null && (
            <AppText className="text-xs text-faint">· BMI {formatNumber(bmiVal)}</AppText>
          )}
        </View>
      ) : (
        <AppText className="text-xs text-soft">Bilgilerini ekle 🌱</AppText>
      )}
    </Pressable>
  )
})
