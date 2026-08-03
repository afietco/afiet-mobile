import Constants from 'expo-constants'
import { router, type Href } from 'expo-router'
import { useCallback, useEffect, useState, type FC } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { track } from '@/lib/track'
import { appVersion } from '@/features/changelog/WhatsNewSheet'
import { releaseNoteFor } from '@/features/changelog/releaseNotes'
import { requestWhatsNew } from '@/features/changelog/whatsNewRequest'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { Overlay } from '@/ui/overlayHost'
import {
  IconChart,
  IconChevronRight,
  IconGear,
  IconPalette,
  IconSparkles,
  IconSunrise,
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
  /* One door instead of two. "Afi" and "Destek sohbeti" sat here side by side
     with nothing to tell them apart: same product, different rules about what
     each one is allowed to know, and a menu row is no place to explain that.
     The centre explains all three and opens any of them. */
  { label: 'Yapay Zeka Merkezi', sub: 'Üç asistan ve nasıl çalıştıkları', href: '/yapay-zeka' as Href, Icon: IconSparkles, tint: ['#0284c7', '#38bdf8'] },
  { label: 'Görünüm', sub: 'Tema ve renkler', href: '/gorunum' as Href, Icon: IconPalette, tint: ['#c026d3', '#e879f9'] },
  { label: 'Hesap ayarlarım', sub: 'E-posta, şifre, çıkış', href: '/hesap', Icon: IconGear, tint: ['#475569', '#94a3b8'] },
]

/** Adds a low alpha channel to the current theme tint. */
const soft = (hex: string) => `${hex}22`

const PANEL_MAX_WIDTH = 340
const OPEN_MS = 260
const CLOSE_MS = 190

export function HamburgerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const window = useWindowDimensions()
  const note = releaseNoteFor(appVersion())
  const { isDark } = useTheme()
  const t = tokens[isDark ? 'dark' : 'light']
  const reduced = useReducedMotion()
  const panelWidth = Math.min(PANEL_MAX_WIDTH, window.width * 0.8)

  /**
   * The panel outlives `open` by exactly the length of its closing slide.
   *
   * Sliding it back in is the whole reason this state exists: a panel that is
   * unmounted the moment it is dismissed can only ever disappear.
   */
  const [mounted, setMounted] = useState(open)
  const progress = useSharedValue(open ? 1 : 0)
  const finishClose = useCallback(() => setMounted(false), [])

  useEffect(() => {
    if (open) {
      setMounted(true)
      progress.value = reduced
        ? 1
        : withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) })
      return
    }
    if (reduced) {
      progress.value = 0
      setMounted(false)
      return
    }
    progress.value = withTiming(
      0,
      { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) },
      (done) => {
        if (done) runOnJS(finishClose)()
      },
    )
  }, [finishClose, open, progress, reduced])

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * panelWidth }],
  }))
  const dimStyle = useAnimatedStyle(() => ({ opacity: progress.value }))

  const go = (href: Href) => {
    onClose()
    router.push(href)
  }

  // Not a Sheet, but the same funnel semantics apply: the panel is a popup
  // people enter and either use or abandon.
  useEffect(() => {
    if (!open) return
    const openedAt = Date.now()
    track('sheet_view', { sheet: 'hamburger_menu', ts: openedAt })
    return () => {
      track('sheet_closed', {
        sheet: 'hamburger_menu',
        duration_sec: Math.max(0, Math.round((Date.now() - openedAt) / 1000)),
      })
    }
  }, [open])

  /* Nothing at all is left behind once the closing slide has finished. */
  if (!mounted) return null

  return (
    <Overlay onRequestClose={onClose}>
      {/*
        The slide is back, under two rules that keep it away from the trap it
        was removed for.

        A panel that is hidden but still laid out is an invisible wall over four
        fifths of a dimmed screen, where almost every tap does nothing; that is
        the shape of the worst trap this app has shipped. So, first: the hidden
        state is off-screen, not transparent. At any point in either animation
        every pixel the panel is not covering belongs to the backdrop, and the
        backdrop closes the menu. A slide that never starts, or one interrupted
        halfway, therefore fails towards the exit rather than away from it.

        Second: touches are refused outright the moment the menu is dismissed,
        for the whole closing slide. While `open` is false this layer cannot
        take a tap from the app underneath even though it is still on screen.
      */}
      <Pressable
        accessibilityLabel="Menüyü kapat"
        onPress={onClose}
        pointerEvents={open ? 'auto' : 'none'}
        style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(2,6,23,0.45)' }, dimStyle]}
        />
        <View style={{ flex: 1 }} />
        <Animated.View
          className="bg-canvas"
          style={[
            {
              width: panelWidth,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
            },
            panelStyle,
          ]}
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

            {/* The version line is where someone looks when they wonder what
                changed, so that is where the notes open from. */}
            <Pressable
              accessibilityRole="button"
              disabled={!note}
              accessibilityLabel="Bu sürümde neler yeni"
              onPress={() => {
                onClose()
                requestWhatsNew()
              }}
              className="mt-auto pt-4 active:opacity-70"
            >
              <AppText className="text-center text-xs text-faint">
                afiet v{Constants.expoConfig?.version ?? '?'}
              </AppText>
              {note ? (
                <AppText
                  weight="semibold"
                  className="mt-1 text-center text-xs text-emerald-700 dark:text-emerald-300"
                >
                  Yenilikler ✨
                </AppText>
              ) : null}
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Overlay>
  )
}
