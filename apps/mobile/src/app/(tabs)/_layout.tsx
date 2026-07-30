import { Redirect, usePathname } from 'expo-router'
import { TopTabs } from 'expo-router/js-top-tabs'
import { useEffect, useState } from 'react'
import { Pressable, useWindowDimensions, View } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import { useAuth } from '@/features/auth/AuthContext'
import { safeAuthReturnPath, SESSION_EXPIRED_REASON } from '@/features/auth/auth-return'
import { ftueSeen } from '@/features/ftue/ftueFlags'
import {
  LiquidTabBar,
  TAB_BAR_ICON_SIZE,
  type TabBarRenderProps,
  type TabIconProps,
} from '@/features/nav/LiquidTabBar'
import { syncPendingFirstMeal } from '@/features/onboarding/pendingFirstMeal'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconScale, IconUsers, IconUtensils } from '@/ui/icons'
import { WhatsNewAutoPrompt } from '@/features/changelog/WhatsNewSheet'
import { PageSkeleton } from '@/ui/PageSkeleton'

function ProfileLoadError({
  retry,
  retrying,
  onSignOut,
}: {
  retry: () => void
  retrying: boolean
  onSignOut: () => Promise<void>
}) {
  const [signingOut, setSigningOut] = useState(false)
  const busy = retrying || signingOut

  const signOut = () => {
    if (busy) return
    setSigningOut(true)
    // signOut drops the session to anon, which redirects to login; on the rare
    // failure we re-enable the button so the user is never stuck here.
    void onSignOut().catch(() => setSigningOut(false))
  }

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-8">
      <AppText weight="extrabold" className="text-center text-2xl text-ink">
        Şu an profiline ulaşamıyoruz
      </AppText>
      <AppText className="mt-3 max-w-sm text-center leading-6 text-soft">
        Bilgilerin güvende. Bağlantını kontrol edip yeniden deneyebilirsin.
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profili yeniden yükle"
        accessibilityState={{ disabled: busy, busy: retrying }}
        disabled={busy}
        onPress={retry}
        className={`mt-7 rounded-2xl bg-emerald-600 px-7 py-3.5 ${busy ? 'opacity-50' : ''}`}
      >
        <AppText weight="bold" className="text-base text-white">
          {retrying ? 'Yeniden deneniyor…' : 'Tekrar dene'}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Çıkış yap ve yeniden giriş yap"
        accessibilityState={{ disabled: busy, busy: signingOut }}
        disabled={busy}
        onPress={signOut}
        className="mt-4 px-4 py-2"
      >
        <AppText weight="bold" className={`text-center text-sm text-soft ${busy ? 'opacity-50' : ''}`}>
          {signingOut ? 'Çıkış yapılıyor…' : 'Sorun sürüyorsa çıkış yap ve yeniden gir'}
        </AppText>
      </Pressable>
    </View>
  )
}

export default function TabsLayout() {
  const { status, sessionEndReason, signOut } = useAuth()
  const pathname = usePathname()
  const { id, loading, error, retry, retrying } = useActiveProfile()
  const reducedMotion = useReducedMotion()
  const { width } = useWindowDimensions()

  useEffect(() => {
    if (status !== 'authed' || id === null) return
    void syncPendingFirstMeal(id).catch((syncError) => {
      console.warn('[onboarding] pending first meal could not be synced', syncError)
    })
  }, [id, status])

  // Anonymous users see the product introduction and first value moment before auth.
  if (status === 'loading') return <PageSkeleton />
  if (status === 'anon') {
    if (sessionEndReason === 'expired') {
      return (
        <Redirect
          href={{
            pathname: '/login',
            params: {
              reason: SESSION_EXPIRED_REASON,
              returnTo: safeAuthReturnPath(pathname),
            },
          }}
        />
      )
    }
    if (!ftueSeen('welcomeIntro')) return <Redirect href="/intro" />
    return <Redirect href={ftueSeen('firstValueCaptured') ? '/login' : '/first-meal'} />
  }
  // Authenticated accounts without an identity complete the minimal onboarding.
  // The retry gives the skeleton its timeout escape: a profile load that never
  // settles used to hold the whole tab bar on a blank page.
  if (loading) return <PageSkeleton onRetry={retry} />
  if (error) return <ProfileLoadError retry={retry} retrying={retrying} onSignOut={signOut} />
  if (id === null) return <Redirect href="/onboarding" />
  return (
    <>
      <TopTabs
        /* Rendered after the scenes at this position, which is what lets the
           floating bar paint over content instead of under it. */
        tabBarPosition="bottom"
        /* Without this the pager measures itself as zero wide on its first
           render and every page starts stacked at the same offset, which it
           only sorts out once a layout pass lands. A swipe that begins in that
           window has nothing to travel along and can settle on the wrong page. */
        initialLayout={{ width }}
        tabBar={(props: TabBarRenderProps) => <LiquidTabBar {...props} />}
        screenOptions={{
          /* A tab still costs nothing until it is first reached, but its
             neighbour is prepared once the current one settles, so a swipe
             lands on a screen with its content already in place rather than on
             a skeleton. */
          lazy: true,
          lazyPreloadDistance: 1,
          lazyPlaceholder: () => <PageSkeleton />,
          animationEnabled: !reducedMotion,
        }}
      >
        {/* The primary tab order is Today, Nutrition, Body, and Group. */}
        <TopTabs.Screen
          name="index"
          options={{
            title: 'Bugün',
            tabBarIcon: ({ color }: TabIconProps) => <IconBowl size={TAB_BAR_ICON_SIZE} color={color as string} />,
          }}
        />
        <TopTabs.Screen
          name="beslenme"
          options={{
            title: 'Beslenme',
            tabBarIcon: ({ color }: TabIconProps) => (
              <IconUtensils size={TAB_BAR_ICON_SIZE} color={color as string} />
            ),
          }}
        />
        <TopTabs.Screen
          name="vucudum"
          options={{
            title: 'Vücudum',
            tabBarIcon: ({ color }: TabIconProps) => (
              <IconScale size={TAB_BAR_ICON_SIZE} color={color as string} />
            ),
          }}
        />
        <TopTabs.Screen
          name="grubum"
          options={{
            title: 'Grubum',
            tabBarIcon: ({ color }: TabIconProps) => (
              <IconUsers size={TAB_BAR_ICON_SIZE} color={color as string} />
            ),
          }}
        />
      </TopTabs>
      {/* Mounted past the profile gate on purpose: there is no "what is new"
          for someone who has not used the old one, and the prompt itself needs
          to know whether a profile exists before it decides. */}
      <WhatsNewAutoPrompt />
    </>
  )
}
