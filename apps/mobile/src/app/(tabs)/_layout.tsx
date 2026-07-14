import { Redirect, Tabs } from 'expo-router'
import { useAuth } from '@/features/auth/AuthContext'
import { ftueSeen } from '@/features/ftue/ftueFlags'
import { useActiveProfile } from '@/features/profile/useActiveProfile'
import { tokens, useTheme } from '@/theme/useTheme'
import { IconBowl, IconCalendar, IconUser, IconUsers } from '@/ui/icons'

export default function TabsLayout() {
  const { isDark } = useTheme()
  const { status } = useAuth()
  const { id, loading } = useActiveProfile()
  const t = tokens[isDark ? 'dark' : 'light']
  // Önce giriş kapısı: girişsiz kullanıcı sekmelere giremez.
  // İlk açılışta login'den önce tanıtım turu görünür (bir kez, welcomeIntro bayrağı).
  if (status === 'loading') return null
  if (status === 'anon')
    return <Redirect href={ftueSeen('welcomeIntro') ? '/login' : '/intro'} />
  // Profil oluşmadan sekmelere girilmez — temiz kurulum onboarding'e iner
  // (web'de App.tsx'teki liveQuery kapısının karşılığı)
  if (loading) return null
  if (id === null) return <Redirect href="/onboarding" />
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: t.faint,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarLabelStyle: { fontFamily: 'Nunito_600SemiBold', fontSize: 11 },
      }}
    >
      {/* tint'ler yukarıda string verildi — ColorValue daralt (ikonlar string bekler) */}
      <Tabs.Screen
        name="(bugun)"
        options={{
          title: 'Bugün',
          tabBarIcon: ({ color, size }) => <IconBowl size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="gecmis"
        options={{
          title: 'Geçmiş',
          tabBarIcon: ({ color, size }) => <IconCalendar size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="grubum"
        options={{
          title: 'Grubum',
          tabBarIcon: ({ color, size }) => <IconUsers size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => <IconUser size={size} color={color as string} />,
        }}
      />
    </Tabs>
  )
}
