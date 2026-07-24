import { Redirect, Tabs, usePathname } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { useAuth } from '@/features/auth/AuthContext'
import { safeAuthReturnPath, SESSION_EXPIRED_REASON } from '@/features/auth/auth-return'
import { ftueSeen, useAfiGuideCompleted, useFtueSeen } from '@/features/ftue/ftueFlags'
import { AnimatedTabBar } from '@/features/nav/animated-tab-bar'
import { syncPendingFirstMeal } from '@/features/onboarding/pendingFirstMeal'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { AppText } from '@/ui/AppText'
import { IconBowl, IconScale, IconUsers, IconUtensils } from '@/ui/icons'
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
  const guideStarted = useFtueSeen('afiGuideStarted')
  const guideDone = useAfiGuideCompleted()
  const guideLocked = guideStarted && !guideDone

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
  if (loading) return <PageSkeleton />
  if (error) return <ProfileLoadError retry={retry} retrying={retrying} onSignOut={signOut} />
  if (id === null) return <Redirect href="/onboarding" />
  return (
    <Tabs
      tabBar={(props) => <AnimatedTabBar {...props} locked={guideLocked} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* The primary tab order is Today, Nutrition, Body, and Group. */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bugün',
          tabBarIcon: ({ color, size }) => <IconBowl size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="beslenme"
        options={{
          title: 'Beslenme',
          tabBarIcon: ({ color, size }) => <IconUtensils size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="vucudum"
        options={{
          title: 'Vücudum',
          tabBarIcon: ({ color, size }) => <IconScale size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="grubum"
        options={{
          title: 'Grubum',
          tabBarIcon: ({ color, size }) => <IconUsers size={size} color={color as string} />,
        }}
      />
    </Tabs>
  )
}
