import type { Profile } from '@afiet/core'
import { formatLongTR, todayISO } from '@afiet/core'
import { Link } from 'expo-router'
import type { FC } from 'react'
import { Pressable, View } from 'react-native'
import { LevelAvatar } from '@/features/progress/LevelAvatar'
import { useProgressResult } from '@/features/progress/useProgress'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight, IconMoon, IconSun, IconSunrise, type IconProps } from '@/ui/icons'

/** Returns a calm time-of-day greeting. */
function greeting(): { text: string; Icon: FC<IconProps> } {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return { text: 'Günaydın', Icon: IconSunrise }
  if (h >= 12 && h < 18) return { text: 'Merhaba', Icon: IconSun }
  if (h >= 18 && h < 22) return { text: 'İyi akşamlar', Icon: IconMoon }
  return { text: 'İyi geceler', Icon: IconMoon }
}

/**
 * Compact greeting header. The avatar doubles as the level indicator: the ring
 * around it fills toward the next level and the number sits on the rim, so the
 * journey is visible from Today without turning the screen into a scoreboard.
 *
 * The whole card is the door to the profile, not just the avatar. A 40 pixel
 * circle was the only tappable thing on a card that looks exactly like every
 * other tappable card on this screen, so the card either did nothing or opened
 * the profile depending on where the thumb landed. The chevron on the right is
 * what says which of the two it is.
 */
export function TodayHeader({ profile }: { profile?: Profile }) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const { text, Icon } = greeting()
  const { data: progress } = useProgressResult()

  return (
    <View className="relative mb-4 overflow-hidden rounded-2xl bg-surface px-5 py-3.5">
      {/* Quiet monochrome watermark, anchored to the corner: with the avatar
          moved left it would otherwise float loose in the middle of the card. */}
      <View pointerEvents="none" className="absolute -bottom-6 -right-3 opacity-10">
        <Icon size={72} color={t.faint} strokeWidth={1.2} />
      </View>

      {/* The avatar leads: it reads as the person the greeting belongs to,
          and the name is free to run the rest of the width. */}
      <Link href="/profil" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            progress ? `Profil, ${progress.title}, seviye ${String(progress.level)}` : 'Profil'
          }
          accessibilityHint="Profilini açar"
          className="flex-row items-center gap-3 active:opacity-70"
        >
          <View className="shrink-0">
            <LevelAvatar
              emoji={profile?.emoji}
              level={progress?.level ?? 1}
              ratio={progress?.ratio ?? 0}
              ready={progress !== undefined}
            />
          </View>
          <View className="min-w-0 flex-1">
            {/* Wraps rather than running off the right edge: greeting, sun and
                a long Turkish date fit one line at the default size and need
                three of them once the text is scaled up. */}
            <View className="flex-row flex-wrap items-center gap-1.5">
              <AppText weight="semibold" className="text-xs text-soft">
                {text}
              </AppText>
              <Icon size={14} color={isDark ? '#fbbf24' : '#f59e0b'} />
              <AppText className="text-xs text-faint">· {formatLongTR(todayISO())}</AppText>
            </View>
            {/* A name is worth a second line before it is worth an ellipsis. */}
            <AppText weight="extrabold" numberOfLines={2} className="text-2xl text-ink">
              {profile?.name}
            </AppText>
          </View>
          <View className="shrink-0 pl-1">
            <IconChevronRight size={20} color={t.faint} />
          </View>
        </Pressable>
      </Link>
    </View>
  )
}
