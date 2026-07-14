import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'

/**
 * Afiyet ritmi şeridi — haftanın 7 noktası (Pzt→Paz). Dolu nokta = afiyet
 * günü; bugünün noktası nabız gibi hafifçe atar. Kayıp dili YOK: boş nokta
 * "kaçırılmış gün" değil, sadece dolmamış nokta (sofra payı zaten hakkın).
 * hero: Beslenme kartının degrade zemininde beyaz tonlarla çizilir.
 * Bkz. docs/feature-list/afiyet-ritmi.md.
 */

const DAY_LABELS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

function TodayPulse({ filled, hero }: { filled: boolean; hero: boolean }) {
  const scale = useSharedValue(1)
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.25, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    )
  }, [scale])
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const on = hero ? 'bg-white' : 'bg-emerald-500'
  const off = hero ? 'border-2 border-white' : 'border-2 border-emerald-500'
  return <Animated.View style={style} className={`h-3.5 w-3.5 rounded-full ${filled ? on : off}`} />
}

export function RhythmStrip({
  week,
  todayIndex,
  goal = 5,
  hero = false,
}: {
  /** Pzt→Paz, true = afiyet günü. */
  week: boolean[]
  todayIndex: number
  goal?: number
  hero?: boolean
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const done = week.filter(Boolean).length
  const emptyBg = hero ? 'rgba(255,255,255,0.30)' : t.muted

  return (
    <View
      className={`mt-4 border-t pt-3 ${hero ? 'border-white/25' : 'border-line/60'}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {week.map((filled, i) => (
            <View key={DAY_LABELS[i]} className="items-center gap-1">
              {i === todayIndex ? (
                <TodayPulse filled={filled} hero={hero} />
              ) : (
                <View
                  className={`h-3.5 w-3.5 rounded-full ${
                    filled ? (hero ? 'bg-white' : 'bg-emerald-500') : ''
                  }`}
                  style={filled ? undefined : { backgroundColor: emptyBg }}
                />
              )}
              <AppText
                weight={i === todayIndex ? 'bold' : 'normal'}
                className="text-[10px]"
                style={{ color: hero ? 'rgba(255,255,255,0.85)' : t.faint }}
              >
                {DAY_LABELS[i]}
              </AppText>
            </View>
          ))}
        </View>
        <View className="items-end">
          <AppText
            weight="extrabold"
            className="text-lg"
            style={{ color: hero ? '#ffffff' : t.ink }}
          >
            {done}/{goal}
          </AppText>
          <AppText
            weight="semibold"
            className="text-[10px]"
            style={{ color: hero ? 'rgba(255,255,255,0.85)' : t.soft }}
          >
            afiyet günü
          </AppText>
        </View>
      </View>
    </View>
  )
}
