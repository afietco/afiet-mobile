import { WATER_TARGET_GLASSES } from '@afiet/core'
import * as Haptics from 'expo-haptics'
import { Pressable, View } from 'react-native'
import { waterRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { CardHeader } from '@/ui/CardHeader'
import { IconDrop, IconMinus, IconPlus } from '@/ui/icons'

/** Su kartı — web WaterCounter.tsx portu; bardak değişiminde haptik tık */
export function WaterCounter({
  profileId,
  date,
  target = WATER_TARGET_GLASSES,
}: {
  profileId: number
  date: string
  /** Günlük bardak hedefi — Vücudum verisi varsa TDEE'den kişiselleşir */
  target?: number
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const log = useLive(['water'], () => waterRepo.forDay(profileId, date), [profileId, date])
  const glasses = log?.glasses ?? 0

  const change = (delta: number) => {
    void Haptics.selectionAsync()
    void waterRepo.setGlasses(profileId, date, Math.max(0, glasses + delta))
  }

  const sky = isDark ? '#38bdf8' : '#0284c7'

  return (
    <View className="rounded-2xl bg-surface p-4">
      <CardHeader
        icon={<IconDrop size={22} color={sky} />}
        iconBg="bg-sky-100 dark:bg-sky-900/50"
        title="Su"
        meta={
          <AppText className="text-sm text-soft">
            {glasses}/{target} bardak
          </AppText>
        }
      />
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bir bardak azalt"
          onPress={() => change(-1)}
          disabled={glasses === 0}
          className={`h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted ${
            glasses === 0 ? 'opacity-30' : ''
          }`}
        >
          <IconMinus size={20} color={t.soft} strokeWidth={2.2} />
        </Pressable>
        <View className="min-w-0 flex-1">
          <View className="h-3.5 overflow-hidden rounded-full bg-muted">
            <View
              className="h-full rounded-full bg-sky-500"
              style={{ width: `${Math.min(100, (glasses / target) * 100)}%` }}
            />
          </View>
          <View className="mt-1.5 flex-row items-center gap-1">
            <IconDrop size={14} color="#0ea5e9" />
            <AppText className="text-xs text-faint">
              {glasses >= target
                ? 'Günlük hedef tamam! 💙'
                : `Hedefe ${target - glasses} bardak kaldı`}
            </AppText>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Bir bardak ekle"
          onPress={() => change(1)}
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500"
        >
          <IconPlus size={20} color="#ffffff" strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  )
}
