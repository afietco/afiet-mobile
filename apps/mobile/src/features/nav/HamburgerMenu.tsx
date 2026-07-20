import Constants from 'expo-constants'
import { router, type Href } from 'expo-router'
import type { FC } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, { SlideInRight } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import {
  IconChart,
  IconChevronRight,
  IconGear,
  IconPalette,
  IconUser,
  IconUsers,
  IconX,
  type IconProps,
} from '@/ui/icons'

/** Opens secondary destinations that do not belong in the primary tab bar. */
interface MenuItem {
  label: string
  sub: string
  href: Href
  Icon: FC<IconProps>
  tint: [string, string]
}

// Cast routes that are not yet represented in the generated typed-route map.
const ITEMS: MenuItem[] = [
  { label: 'Profilim', sub: 'İsmin, avatarın, tema', href: '/profil', Icon: IconUser, tint: ['#059669', '#34d399'] },
  { label: 'Arkadaşlarım', sub: 'Arkadaşların, istekler', href: '/arkadaslarim' as Href, Icon: IconUsers, tint: ['#e11d48', '#fb7185'] },
  { label: 'Bilgilerim', sub: 'Bakış, alışkanlıklar ve geçmiş', href: '/bilgilerim', Icon: IconChart, tint: ['#7c3aed', '#a78bfa'] },
  { label: 'Görünüm', sub: 'Tema ve renkler', href: '/gorunum' as Href, Icon: IconPalette, tint: ['#c026d3', '#e879f9'] },
  { label: 'Hesap ayarlarım', sub: 'E-posta, şifre, çıkış', href: '/hesap', Icon: IconGear, tint: ['#475569', '#94a3b8'] },
]

/** Adds a low alpha channel to the current theme tint. */
const soft = (hex: string) => `${hex}22`

export function HamburgerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']

  const go = (href: Href) => {
    onClose()
    router.push(href)
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Menüyü kapat"
        onPress={onClose}
        style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(2,6,23,0.45)' }}
      >
        <View style={{ flex: 1 }} />
        <Animated.View
          entering={SlideInRight.duration(220)}
          className="bg-canvas"
          style={{
            width: '80%',
            maxWidth: 340,
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 16,
          }}
        >
          {/* Consume panel touches so only the backdrop closes the menu. */}
          <Pressable onPress={() => {}} className="flex-1 px-4">
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <AppText weight="extrabold" className="text-2xl text-emerald-600">
                  afiet
                </AppText>
                <AppText className="text-xs text-soft">Sayma, dengele.</AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kapat"
                onPress={onClose}
                hitSlop={8}
                className="h-10 w-10 items-center justify-center rounded-full bg-muted"
              >
                <IconX size={18} color={t.soft} />
              </Pressable>
            </View>

            <View className="gap-2">
              {ITEMS.map((it) => {
                const color = isDark ? it.tint[1] : it.tint[0]
                return (
                  <Pressable
                    key={it.label}
                    accessibilityRole="button"
                    onPress={() => go(it.href)}
                    className="flex-row items-center gap-3 rounded-2xl bg-surface p-3.5 active:opacity-80"
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: soft(color) }}
                    >
                      <it.Icon size={22} color={color} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <AppText weight="bold" className="text-ink">
                        {it.label}
                      </AppText>
                      <AppText numberOfLines={1} className="text-xs text-soft">
                        {it.sub}
                      </AppText>
                    </View>
                    <IconChevronRight size={18} color={t.faint} />
                  </Pressable>
                )
              })}
            </View>

            <AppText className="mt-auto pt-4 text-center text-xs text-faint">
              afiet v{Constants.expoConfig?.version ?? '?'}
            </AppText>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}
