import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBook, IconBookmark, IconChevronRight } from '@/ui/icons'

/**
 * Besin Rehberi ve Menüm kısayol kartları — hem Beslenme sayfasında hem Bugün
 * panosunda AYNI kart kullanılsın diye tek yerde. İkisi de flex-1 (iki sütunlu
 * satırda eşit genişlik).
 */

export function GuideShortcutCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <Link href="/besinler" asChild>
      <Pressable
        accessibilityRole="button"
        className="flex-1 rounded-2xl bg-surface p-4 active:opacity-80"
      >
        <View className="flex-row items-center justify-between">
          <IconBook size={24} color={isDark ? '#34d399' : '#059669'} />
          <IconChevronRight size={16} color={t.faint} />
        </View>
        <AppText weight="bold" className="mt-2 text-ink">
          Besin Rehberi
        </AppText>
        <AppText className="text-xs text-soft">Listedeki besinler ve değerleri</AppText>
      </Pressable>
    </Link>
  )
}

export function MenuShortcutCard() {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <Link href="/menum" asChild>
      <Pressable
        accessibilityRole="button"
        className="flex-1 rounded-2xl bg-surface p-4 active:opacity-80"
      >
        <View className="flex-row items-center justify-between">
          <IconBookmark size={24} color={isDark ? '#c4b5fd' : '#7c3aed'} />
          <IconChevronRight size={16} color={t.faint} />
        </View>
        <AppText weight="bold" className="mt-2 text-ink">
          Menüm
        </AppText>
        <AppText className="text-xs text-soft">Kaydettiğin besinler</AppText>
      </Pressable>
    </Link>
  )
}
