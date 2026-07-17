import Constants from 'expo-constants'
import { router, type Href } from 'expo-router'
import type { FC } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, { SlideInRight } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import {
  IconCalendar,
  IconChart,
  IconChevronRight,
  IconGear,
  IconPalette,
  IconRepeat,
  IconUser,
  IconUsers,
  IconX,
  type IconProps,
} from '@/ui/icons'

/**
 * Sağdan açılan menü, sekmeden çıkan ikincil sayfalara kapı. Sekme çubuğu
 * yalnız günlük dört akışı taşır (Bugün · Beslenme · Vücudum · Grubum); profil,
 * istatistik, alışkanlık, geçmiş ve hesap buraya taşındı. Modal kendi native
 * penceresinde açıldığından her ekrandan güvenle çağrılır (kaydırma alanına
 * gömülü olması sorun değil).
 */
interface MenuItem {
  label: string
  sub: string
  href: Href
  Icon: FC<IconProps>
  tint: [string, string]
}

// Not: /arkadaslarim ve /gorunum route dosyaları sosyal katmanda ayrı ajanlarca
// eklenir; typedRoutes onları henüz tanımadığından href'leri Href'e cast'lenir
// (dosyalar gelince cast zararsızca geçerli kalır).
const ITEMS: MenuItem[] = [
  { label: 'Profilim', sub: 'İsmin, avatarın, tema', href: '/profil', Icon: IconUser, tint: ['#059669', '#34d399'] },
  { label: 'Arkadaşlarım', sub: 'Arkadaşların, istekler', href: '/arkadaslarim' as Href, Icon: IconUsers, tint: ['#e11d48', '#fb7185'] },
  { label: 'Bilgilerim', sub: 'İstatistiklerin bir bakışta', href: '/bilgilerim', Icon: IconChart, tint: ['#7c3aed', '#a78bfa'] },
  { label: 'Alışkanlıklarım', sub: 'Ritmin ve kayıt düzenin', href: '/aliskanliklarim', Icon: IconRepeat, tint: ['#0284c7', '#38bdf8'] },
  { label: 'Geçmiş günler', sub: 'Son günlerin dökümü', href: '/gecmis', Icon: IconCalendar, tint: ['#d97706', '#fbbf24'] },
  { label: 'Görünüm', sub: 'Tema ve renkler', href: '/gorunum' as Href, Icon: IconPalette, tint: ['#c026d3', '#e879f9'] },
  { label: 'Hesap ayarlarım', sub: 'E-posta, şifre, çıkış', href: '/hesap', Icon: IconGear, tint: ['#475569', '#94a3b8'] },
]

/** [açık, koyu] hex'e ~13% opaklık ekler, yumuşak ikon zemini. */
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
          {/* Panele dokunuş kapatmayı tetiklemesin (boş onPress touch'ı yutar) */}
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
