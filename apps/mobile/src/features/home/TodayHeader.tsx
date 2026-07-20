import type { Profile } from '@afiet/core'
import { formatLongTR, todayISO } from '@afiet/core'
import { Link } from 'expo-router'
import type { FC } from 'react'
import { Pressable, Text, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconMoon, IconSun, IconSunrise, type IconProps } from '@/ui/icons'

/** Returns a calm time-of-day greeting. */
function greeting(): { text: string; Icon: FC<IconProps> } {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return { text: 'Günaydın', Icon: IconSunrise }
  if (h >= 12 && h < 18) return { text: 'Merhaba', Icon: IconSun }
  if (h >= 18 && h < 22) return { text: 'İyi akşamlar', Icon: IconMoon }
  return { text: 'İyi geceler', Icon: IconMoon }
}

/** Compact greeting header; Afiyet rhythm is owned by the Nutrition screen. */
export function TodayHeader({ profile }: { profile?: Profile }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { text, Icon } = greeting()

  return (
    <View className="relative mb-4 overflow-hidden rounded-2xl bg-surface px-5 py-3.5">
      {/* Quiet monochrome watermark. */}
      <View pointerEvents="none" className="absolute -bottom-5 right-16 opacity-10">
        <Icon size={72} color={t.faint} strokeWidth={1.2} />
      </View>

      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-1.5">
            <AppText weight="semibold" className="text-xs text-soft">
              {text}
            </AppText>
            <Icon size={14} color={isDark ? '#fbbf24' : '#f59e0b'} />
            <AppText className="text-xs text-faint">· {formatLongTR(todayISO())}</AppText>
          </View>
          <AppText weight="extrabold" numberOfLines={1} className="text-2xl text-ink">
            {profile?.name}
          </AppText>
        </View>
        <Link href="/profil" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil"
            className="h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted"
          >
            <Text style={{ fontSize: 22, lineHeight: 28 }}>{profile?.emoji}</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  )
}
