import { WATER_TARGET_GLASSES } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { Pressable, View } from 'react-native'
import { waterRepo } from '@/data/repositories'
import { useLive } from '@/data/useLive'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconDrop, IconMinus, IconPlus } from '@/ui/icons'

/** Bugün panosunun minimal Su kartı (yarım genişlik) — bardak değişiminde
    haptik tık; tam sayaç yerine ince bar + kompakt −/+. */
export function WaterMiniCard({
  profileId,
  date,
  target = WATER_TARGET_GLASSES,
}: {
  profileId: number
  date: string
  target?: number
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const sky = isDark ? '#38bdf8' : '#0284c7'
  const log = useLive(['water'], () => waterRepo.forDay(profileId, date), [profileId, date])
  const glasses = log?.glasses ?? 0

  const change = (delta: number) => {
    void Haptics.selectionAsync()
    void waterRepo.setGlasses(profileId, date, Math.max(0, glasses + delta))
  }

  return (
    <View className="flex-1 rounded-2xl bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
          <IconDrop size={20} color={sky} />
        </View>
        <AppText weight="semibold" className="text-xs text-soft">
          {glasses}/{target} bardak
        </AppText>
      </View>
      <AppText weight="bold" className="mt-2 text-ink">
        Su
      </AppText>
      <View className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <View
          className="h-full rounded-full bg-sky-500"
          style={{ width: `${Math.min(100, (glasses / target) * 100)}%` }}
        />
      </View>
      <View className="mt-2.5 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bir bardak azalt"
          onPress={() => change(-1)}
          disabled={glasses === 0}
          className={`h-8 w-8 items-center justify-center rounded-full bg-muted ${
            glasses === 0 ? 'opacity-30' : ''
          }`}
        >
          <IconMinus size={16} color={t.soft} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bir bardak ekle"
          onPress={() => change(1)}
          className="h-8 w-8 items-center justify-center rounded-full bg-sky-500"
        >
          <IconPlus size={16} color="#ffffff" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  )
}
