import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from './AppText'
import { IconChevronRight } from './icons'

/**
 * İkincil (hamburger menüden açılan) sayfaların üst başlığı: geri oku + başlık
 * (+ opsiyonel ikon/alt başlık). Sekme ekranları AppHeader kullanır; buradaki
 * geri oku sekme çubuğunun üstüne push'lanan sayfaları geri götürür.
 */
export function ScreenHeader({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
}) {
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  return (
    <View className="mb-4 flex-row items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Geri dön"
        onPress={() => router.back()}
        className="-ml-2 h-9 w-9 items-center justify-center rounded-full"
      >
        <View style={{ transform: [{ rotate: '180deg' }] }}>
          <IconChevronRight size={20} color={t.faint} />
        </View>
      </Pressable>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          {icon}
          <AppText weight="extrabold" className="text-2xl text-ink">
            {title}
          </AppText>
        </View>
        {subtitle ? <AppText className="text-sm text-soft">{subtitle}</AppText> : null}
      </View>
    </View>
  )
}
