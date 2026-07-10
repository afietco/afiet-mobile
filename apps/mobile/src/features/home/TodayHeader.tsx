import type { Profile } from '@afiet/core'
import { calcStreak, formatLongTR, todayISO } from '@afiet/core'
import { Link } from 'expo-router'
import type { FC } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { mealRepo } from '../../data/repositories'
import { useLive } from '../../data/useLive'
import { AppText } from '@/ui/AppText'
import { IconFlame, IconMoon, IconSparkles, IconSun, IconSunrise, type IconProps } from '@/ui/icons'

/** Saate göre karşılama — günün ritmine eşlik eder */
function greeting(): { text: string; Icon: FC<IconProps> } {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return { text: 'Günaydın', Icon: IconSunrise }
  if (h >= 12 && h < 18) return { text: 'Merhaba', Icon: IconSun }
  if (h >= 18 && h < 22) return { text: 'İyi akşamlar', Icon: IconMoon }
  return { text: 'İyi geceler', Icon: IconMoon }
}

/** Bugün hero başlığı — web TodayHeader.tsx portu (degrade SVG ile) */
export function TodayHeader({ profileId, profile }: { profileId: number; profile?: Profile }) {
  const { text, Icon } = greeting()
  const loggedDates = useLive(['meals'], () => mealRepo.loggedDates(profileId), [profileId])
  const streak = calcStreak(loggedDates ?? [])
  const hasToday = (loggedDates ?? []).includes(todayISO())

  return (
    <View className="relative mb-4 overflow-hidden rounded-3xl p-5">
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="today" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#059669" />
            <Stop offset="0.55" stopColor="#10b981" />
            <Stop offset="1" stopColor="#14b8a6" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#today)" />
      </Svg>
      {/* Dekor: yumuşak ışık lekesi + filigran ikon (blur native'de yok) */}
      <View
        pointerEvents="none"
        className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-white/15"
      />
      <View pointerEvents="none" className="absolute -bottom-8 -right-4 opacity-15">
        <Icon size={128} color="#ffffff" strokeWidth={1.2} />
      </View>

      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <AppText weight="semibold" className="text-sm text-emerald-50/90">
              {text}
            </AppText>
            <Icon size={18} color="#ecfdf5" />
          </View>
          <AppText weight="extrabold" numberOfLines={1} className="text-3xl text-white">
            {profile?.name}
          </AppText>
          <AppText className="mt-0.5 text-sm text-emerald-50/80">{formatLongTR(todayISO())}</AppText>
        </View>
        <Link href="/profil" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil"
            className="h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/30 bg-white/20"
          >
            <Text style={{ fontSize: 24, lineHeight: 30 }}>{profile?.emoji}</Text>
          </Pressable>
        </Link>
      </View>

      <View className="mt-3 flex-row">
        <View className="flex-row items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1">
          {streak > 0 ? (
            <>
              <IconFlame size={16} color="#fcd34d" />
              <AppText weight="semibold" className="text-sm text-white">
                {streak} gün seri{!hasToday && ' — bugünü de ekle!'}
              </AppText>
            </>
          ) : (
            <>
              <IconSparkles size={16} color="#fcd34d" />
              <AppText weight="semibold" className="text-sm text-white">
                İlk kaydınla seriyi başlat
              </AppText>
            </>
          )}
        </View>
      </View>
    </View>
  )
}
