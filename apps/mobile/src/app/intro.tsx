import * as Haptics from 'expo-haptics'
import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useAuth } from '@/features/auth/AuthContext'
import { markFtueSeen } from '@/features/ftue/ftueFlags'
import {
  createGroupInvitePath,
  groupInviteAuthParams,
  groupInviteFromRouteParams,
} from '@/features/groups/inviteContext'
import {
  AURA_SCALE,
  introAfiSize,
  introShowsMarks,
  pageAt,
  pageOffset,
} from '@/features/onboarding/introStage'
import { tokens, useTheme } from '@/theme/useTheme'
import { AppText } from '@/ui/AppText'
import { IconChevronRight } from '@/ui/icons'
import { AfiPose, type AfiMotion, type AfiPoseName } from '@/ui/maskot'

/* The three-page introduction leads directly to the first local meal entry.
   Development tools must use dedicated routes and never bypass this screen.

   Each page is a scene: Afi holds the pose that carries the promise, a soft
   aura in the page accent lights the stage, and the copy follows underneath.
   Everything is driven by the pager offset rather than mount-time entrances,
   so the composition reacts while the finger is still down and reads the same
   whether the page is swiped, dragged half way back, or reached by the button. */

type Page = {
  key: string
  pose: AfiPoseName
  motion: AfiMotion
  /** Accent per theme: [light, dark]. */
  accent: [string, string]
  kicker: string
  title: string
  body: string
  /** Three short proofs; the brand's own words, never a feature list. */
  marks: string[]
  /** What a screen reader hears in place of the mascot. */
  afiLabel: string
}

const PAGES: Page[] = [
  {
    key: 'denge',
    pose: 'selam',
    motion: 'selam',
    accent: ['#059669', '#34d399'],
    kicker: 'Yaklaşım',
    title: 'Sayma, dengele.',
    body: 'afiet kalori saydırmaz. Tabağındaki besin gruplarının dengesine bakar; sofrada seni seven biri gibi, yargısız.',
    marks: ['Kalori yok', 'Yargı yok', 'Denge var'],
    afiLabel: 'Afi selam veriyor',
  },
  {
    key: 'sofra',
    pose: 'kasik',
    motion: 'idle',
    accent: ['#d97706', '#fbbf24'],
    kicker: 'Ölçü',
    title: 'Sofranın diliyle',
    body: 'Bir dilim ekmek, bir kase çorba, bir avuç fındık… Yediklerini kendi ölçülerinle, saniyeler içinde kaydet.',
    marks: ['Bir dilim', 'Bir kase', 'Bir avuç'],
    afiLabel: 'Afi kaşığıyla bekliyor',
  },
  {
    key: 'aile',
    pose: 'aile',
    motion: 'aile',
    accent: ['#e11d48', '#fb7185'],
    kicker: 'Birlikte',
    title: 'Ailece, birlikte',
    body: 'Sevdiklerinle grup kur, dengeyi birlikte kovala. Küçük adımlar kutlanır; suçluluk bu sofrada yok.',
    marks: ['Grup kur', 'Birlikte kutla', 'Suçluluk yok'],
    afiLabel: 'Afi ve küçük Afi yan yana',
  },
]

/* Animated.View drops NativeWind class names once an animated style is applied,
   so every layout rule inside an animated wrapper is written as a style object. */
const centered = { alignItems: 'center', justifyContent: 'center' } as const

export default function IntroScreen() {
  const params = useLocalSearchParams<{
    inviteCode?: string | string[]
    groupName?: string | string[]
    inviterName?: string | string[]
  }>()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const { isDark } = useTheme()
  const { status } = useAuth()
  const scrollRef = useRef<ScrollView>(null)
  const [page, setPage] = useState(0)
  const scrollX = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x
  })

  /* The active page is claimed the moment the pager crosses the halfway point
     rather than when it settles, so the button label and the skip action keep
     up with the finger and a detent is felt at the crossing. */
  const openPage = useCallback((index: number) => {
    setPage(index)
    void Haptics.selectionAsync()
  }, [])
  useAnimatedReaction(
    () => pageAt(scrollX.value, width, PAGES.length),
    (index, previous) => {
      if (previous === null || index === previous) return
      runOnJS(openPage)(index)
    },
    [width, openPage],
  )

  const skipStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      pageOffset(scrollX.value, width, 0),
      [PAGES.length - 2, PAGES.length - 1],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }))

  const pendingInvite = groupInviteFromRouteParams(params)
  const authenticatedDestination = pendingInvite
    ? (createGroupInvitePath(pendingInvite.code, pendingInvite) as Href)
    : '/'

  // Authenticated users do not need the pre-account introduction.
  if (status === 'authed') return <Redirect href={authenticatedDestination} />

  const t = tokens[isDark ? 'dark' : 'light']
  const tone = isDark ? 1 : 0
  const last = page === PAGES.length - 1
  const afiSize = introAfiSize(width, height)
  const showsMarks = introShowsMarks(height)

  const finish = () => {
    markFtueSeen('welcomeIntro')
    router.replace({
      pathname: '/first-meal',
      params: pendingInvite ? groupInviteAuthParams(pendingInvite) : {},
    })
  }

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true })
  }

  return (
    <View
      className="flex-1 bg-canvas"
      style={{ paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 16) }}
    >
      {/* Top bar with the wordmark and skip action. */}
      <View className="flex-row items-center justify-between px-5">
        <AppText weight="extrabold" className="text-2xl text-emerald-600">
          afiet
        </AppText>
        <Animated.View style={skipStyle} pointerEvents={last ? 'none' : 'auto'}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tanıtımı atla"
            onPress={finish}
            className="px-2 py-1"
            disabled={last}
          >
            <AppText weight="semibold" className="text-faint">
              Atla
            </AppText>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {PAGES.map((p, i) => (
          <IntroPage
            key={p.key}
            page={p}
            index={i}
            scrollX={scrollX}
            width={width}
            afiSize={afiSize}
            showsMarks={showsMarks}
            accent={p.accent[tone]}
          />
        ))}
      </Animated.ScrollView>

      <View className="px-5 pt-2">
        <View className="mb-5 h-2 flex-row items-center justify-center gap-2">
          {PAGES.map((p, i) => (
            <Dot
              key={p.key}
              index={i}
              scrollX={scrollX}
              width={width}
              accent={p.accent[tone]}
              idle={t.line}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={last ? 'Tanıtımı bitir ve ilk kaydına geç' : 'Sonraki sayfa'}
          onPress={() => (last ? finish() : goTo(page + 1))}
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
          className="w-full flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 active:opacity-90"
        >
          <AppText weight="bold" className="text-lg text-white">
            {last ? 'Hadi başlayalım 🌱' : 'Devam'}
          </AppText>
          {last ? null : <IconChevronRight size={20} color="#ffffff" />}
        </Pressable>
      </View>
    </View>
  )
}

/**
 * One scene. `offset` is the page's distance from the viewport centre in pages:
 * 0 while centred, ±1 when a full page away. Afi drifts against the scroll so
 * it reads as further back than the copy.
 */
function IntroPage({
  page,
  index,
  scrollX,
  width,
  afiSize,
  showsMarks,
  accent,
}: {
  page: Page
  index: number
  scrollX: SharedValue<number>
  width: number
  afiSize: number
  showsMarks: boolean
  accent: string
}) {
  const stageStyle = useAnimatedStyle(() => {
    const offset = pageOffset(scrollX.value, width, index)
    const away = Math.abs(offset)
    return {
      opacity: interpolate(away, [0, 0.85], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: offset * width * 0.34 },
        { scale: interpolate(away, [0, 1], [1, 0.72], Extrapolation.CLAMP) },
      ],
    }
  })
  const copyStyle = useAnimatedStyle(() => {
    const offset = pageOffset(scrollX.value, width, index)
    const away = Math.abs(offset)
    return {
      opacity: interpolate(away, [0, 0.6], [1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: offset * width * 0.12 },
        { translateY: interpolate(away, [0, 1], [0, 22], Extrapolation.CLAMP) },
      ],
    }
  })

  const aura = afiSize * AURA_SCALE

  return (
    /* The scene is centred while it fits and scrolls once it does not, which is
       what keeps it whole on a short phone and at the largest text sizes. */
    <ScrollView
      style={{ width }}
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
        paddingVertical: 8,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[{ width: aura, height: aura }, centered, stageStyle]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id={`aura-${page.key}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={accent} stopOpacity={0.3} />
                <Stop offset="0.5" stopColor={accent} stopOpacity={0.11} />
                <Stop offset="1" stopColor={accent} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill={`url(#aura-${page.key})`} />
          </Svg>
        </View>
        <AfiPose
          pose={page.pose}
          motion={page.motion}
          size={afiSize}
          accessibilityLabel={page.afiLabel}
        />
      </Animated.View>

      <Animated.View style={[{ alignItems: 'center' }, copyStyle]}>
        <View
          style={{ backgroundColor: `${accent}1f` }}
          className="mb-3 rounded-full px-3 py-1"
        >
          <AppText weight="bold" style={{ color: accent }} className="text-xs">
            {page.kicker}
          </AppText>
        </View>

        <AppText weight="extrabold" className="text-center text-3xl leading-10 text-ink">
          {page.title}
        </AppText>
        <AppText className="mt-3 max-w-xs text-center text-base leading-6 text-soft">
          {page.body}
        </AppText>

        {showsMarks ? (
          <View className="mt-5 flex-row flex-wrap items-center justify-center gap-2">
            {page.marks.map((mark) => (
              <View
                key={mark}
                className="flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5"
              >
                <View
                  style={{ backgroundColor: accent }}
                  className="h-1.5 w-1.5 rounded-full"
                />
                <AppText weight="semibold" className="text-xs text-soft">
                  {mark}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
      </Animated.View>
    </ScrollView>
  )
}

/** Page indicator that stretches into the accent of the page it belongs to. */
function Dot({
  index,
  scrollX,
  width,
  accent,
  idle,
}: {
  index: number
  scrollX: SharedValue<number>
  width: number
  accent: string
  idle: string
}) {
  const style = useAnimatedStyle(() => {
    const at = pageOffset(scrollX.value, width, 0)
    const range = [index - 1, index, index + 1]
    return {
      width: interpolate(at, range, [8, 26, 8], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(at, range, [idle, accent, idle]),
    }
  })

  return <Animated.View style={[{ height: 8, borderRadius: 4 }, style]} />
}
