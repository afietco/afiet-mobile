import { formatNumber, todayISO, type Profile } from '@afiet/core'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'
import { measurementRepo } from '@/data/repositories'
import { useLiveValue } from '@/data/useLive'
import { useSummary } from '@/data/useSummary'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconScale } from '@/ui/icons'

/** Bugün panosunun minimal Vücudum kartı (yarım genişlik). Tam kart /vucudum
    sekmesinde; burada tek kilit sayı + kısayol. */
export function BodyMiniCard({ profileId, profile }: { profileId: number; profile?: Profile }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const violet = isDark ? '#a78bfa' : '#7c3aed'
  const measurements =
    useLiveValue(['measurements'], () => measurementRepo.forProfile(profileId), [profileId]) ?? []
  const summary = useSummary(todayISO())

  const hasAttrs = !!(profile?.sex && profile.birthDate && profile.heightCm && profile.activityLevel)
  const latest = measurements.at(-1)
  const bmiVal = summary?.body?.bmi ?? null

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/vucudum')}
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
}
