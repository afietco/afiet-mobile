import { Link } from 'expo-router'
import { Pressable, View } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconBook, IconBookmark } from '@/ui/icons'

/**
 * Besin Rehberi and Menüm, side by side.
 *
 * They used to be two tall cards: icon on one line, chevron opposite it, label
 * underneath, all inside a p-4 box. Next to the record's own row they read as
 * a different kind of object entirely, and they were twice the height for the
 * same one word each.
 *
 * They are rows now, in the Today board's language: a tinted chip, a title,
 * nothing else. They keep sharing one line rather than stacking, because the
 * two belong together, and with the history row above them the three read as
 * one short stack instead of a card wall.
 *
 * Both are flex-1, so the pair splits whatever width it is given.
 */

function ShortcutRow({
  href,
  icon,
  chip,
  title,
}: {
  href: '/besinler' | '/menum'
  icon: ReactNode
  /** Tint class pair for the chip behind the icon. */
  chip: string
  title: string
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-2xl bg-surface px-3 py-3 active:bg-muted"
      >
        <View className={`h-9 w-9 shrink-0 items-center justify-center rounded-xl ${chip}`}>
          {icon}
        </View>
        <AppText weight="bold" numberOfLines={1} className="min-w-0 shrink text-ink">
          {title}
        </AppText>
      </Pressable>
    </Link>
  )
}

export function GuideShortcutCard() {
  const { isDark } = useTheme()
  return (
    <ShortcutRow
      href="/besinler"
      chip="bg-emerald-100 dark:bg-emerald-900/50"
      icon={<IconBook size={20} color={isDark ? '#34d399' : '#059669'} />}
      title="Besin Rehberi"
    />
  )
}

export function MenuShortcutCard() {
  const { isDark } = useTheme()
  return (
    <ShortcutRow
      href="/menum"
      chip="bg-violet-100 dark:bg-violet-900/50"
      icon={<IconBookmark size={20} color={isDark ? '#c4b5fd' : '#7c3aed'} />}
      title="Menüm"
    />
  )
}
