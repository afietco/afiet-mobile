import * as Haptics from 'expo-haptics'
import { Redirect, router } from 'expo-router'
import { useRef, useState, type ComponentType } from 'react'
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useAuth } from '@/features/auth/AuthContext'
import { markFtueSeen } from '@/features/ftue/ftueFlags'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconHeart, IconWheat } from '@/ui/icons'
import type { IconProps } from '@/ui/icons'

/* İlk açılış tanıtımı — girişten ÖNCE, 3 sayfalık kaydırmalı tur.
   Bitince `welcomeIntro` bayrağı atılır ve /login'e inilir; bir daha görünmez.
   (Giriş sonrası profil kurulumu ayrı ekrandır: onboarding.tsx) */

type Page = {
  key: string
  icon: ComponentType<IconProps>
  gradient: [string, string]
  title: string
  body: string
}

const PAGES: Page[] = [
  {
    key: 'denge',
    icon: IconBowl,
    gradient: ['#10b981', '#2dd4bf'],
    title: 'Sayma, dengele.',
    body: 'afiet kalori saydırmaz. Tabağındaki besin gruplarının dengesine bakar — sofrada seni seven biri gibi, yargısız.',
  },
  {
    key: 'sofra',
    icon: IconWheat,
    gradient: ['#f59e0b', '#fb923c'],
    title: 'Sofranın diliyle',
    body: 'Bir dilim ekmek, bir kase çorba, bir avuç fındık… Yediklerini kendi ölçülerinle, saniyeler içinde kaydet.',
  },
  {
    key: 'aile',
    icon: IconHeart,
    gradient: ['#f43f5e', '#f472b6'],
    title: 'Ailece, birlikte',
    body: 'Sevdiklerinle grup kur, dengeyi birlikte kovala. Küçük adımlar kutlanır — suçluluk bu sofrada yok.',
  },
]

export default function IntroScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { status } = useAuth()
  const scrollRef = useRef<ScrollView>(null)
  const [page, setPage] = useState(0)

  // Girişli kullanıcının tanıtımla işi yok (deep link vb.)
  if (status === 'authed') return <Redirect href="/" />

  const last = page === PAGES.length - 1

  const finish = () => {
    markFtueSeen('welcomeIntro')
    router.replace('/login')
  }

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true })
  }

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width)
    if (i !== page) {
      setPage(i)
      void Haptics.selectionAsync()
    }
  }

  return (
    <View
      className="flex-1 bg-canvas"
      style={{ paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }}
    >
      {/* Üst şerit: wordmark + Atla */}
      <View className="flex-row items-center justify-between px-5">
        <AppText weight="extrabold" className="text-2xl text-emerald-600">
          afiet
        </AppText>
        <Pressable
          accessibilityRole="button"
          onPress={finish}
          className={`px-2 py-1 ${last ? 'opacity-0' : ''}`}
          disabled={last}
        >
          <AppText weight="semibold" className="text-faint">
            Atla
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        className="flex-1"
      >
        {PAGES.map((p) => {
          const Icon = p.icon
          return (
            <View key={p.key} style={{ width }} className="items-center justify-center px-8">
              <Animated.View entering={ZoomIn.duration(300)}>
                <View className="mb-8 h-28 w-28 items-center justify-center overflow-hidden rounded-[36px]">
                  {/* NativeWind'de native gradient yok — marka degradesi SVG ile */}
                  <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
                    <Defs>
                      <LinearGradient id={`g-${p.key}`} x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor={p.gradient[0]} />
                        <Stop offset="1" stopColor={p.gradient[1]} />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill={`url(#g-${p.key})`} />
                  </Svg>
                  <Icon size={56} color="#ffffff" strokeWidth={1.6} />
                </View>
              </Animated.View>
              <Animated.View entering={FadeInDown.duration(300).delay(80)}>
                <AppText weight="extrabold" className="text-center text-3xl text-ink">
                  {p.title}
                </AppText>
                <AppText className="mt-4 max-w-xs text-center text-base leading-6 text-soft">
                  {p.body}
                </AppText>
              </Animated.View>
            </View>
          )
        })}
      </ScrollView>

      <View className="px-5 pt-2">
        {/* Sayfa noktaları */}
        <View className="mb-5 flex-row items-center justify-center gap-2">
          {PAGES.map((p, i) => (
            <View
              key={p.key}
              className={`h-2 rounded-full ${
                i === page ? 'w-6 bg-emerald-500' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => (last ? finish() : goTo(page + 1))}
          className="w-full items-center rounded-2xl bg-emerald-600 py-4 active:opacity-90"
        >
          <AppText weight="bold" className="text-lg text-white">
            {last ? 'Hadi başlayalım 🌱' : 'Devam'}
          </AppText>
        </Pressable>
      </View>
    </View>
  )
}
